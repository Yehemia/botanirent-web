-- ============================================================
-- Migration 015: Update Rental Logic & Settings Table
-- Mengubah sistem harga sewa menjadi siklus tetap dan menambahkan tabel settings
-- ============================================================

-- 1. Create settings table
CREATE TABLE IF NOT EXISTS public.settings (
    key text primary key,
    value jsonb not null,
    updated_at timestamptz not null default now()
);
    
-- 2. Insert default settings
INSERT INTO public.settings (key, value) VALUES
    ('rental', '{"default_rental_duration_days": 4, "late_fee_per_day_per_transaction": 10000}')
ON CONFLICT (key) DO NOTHING;

-- 3. Replace checkout_transaction function to remove rental_days multiplier
CREATE OR REPLACE FUNCTION checkout_transaction(payload json)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_transaction_id uuid;
    v_transaction_type text := 'retail';
    v_cart json;
    v_item json;
    v_asset_record record;
    v_qty int;
    v_i int;
    v_pkg_item record;
BEGIN
    -- Determine transaction type (retail, rental, hybrid)
    v_transaction_type := payload->>'type';

    -- 1. Insert Transaction Header
    INSERT INTO public.transactions (
        branch_id, cashier_id, customer_id, transaction_code, type,
        subtotal, discount_amount, total_amount, paid_amount, change_amount, payment_method, payment_status, paid_at
    ) VALUES (
        (payload->>'branch_id')::uuid,
        (payload->>'cashier_id')::uuid,
        NULLIF(payload->>'customer_id', '')::uuid,
        payload->>'transaction_code',
        v_transaction_type,
        (payload->>'subtotal')::numeric,
        (payload->>'discount_amount')::numeric,
        (payload->>'total_amount')::numeric,
        (payload->>'paid_amount')::numeric,
        (payload->>'change_amount')::numeric,
        payload->>'payment_method',
        'paid', -- asumsikan pembayaran lunas di meja kasir untuk versi ini
        now()
    ) RETURNING id INTO v_transaction_id;

    -- 2. Loop Keranjang Belanja (Cart)
    v_cart := payload->'cart';
    
    FOR v_item IN SELECT * FROM json_array_elements(v_cart)
    LOOP
        v_qty := (v_item->>'quantity')::int;

        -- CASE A: BARANG RETAIL
        IF v_item->>'type' = 'retail' THEN
            -- Decrease stock
            UPDATE public.items 
            SET stock_available = stock_available - v_qty
            WHERE id = (v_item->>'item_id')::uuid AND stock_available >= v_qty;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'Stok tidak mencukupi untuk barang %', v_item->>'item_name';
            END IF;

            -- Insert transaction item
            INSERT INTO public.transaction_items (
                transaction_id, item_id, type, item_name, quantity, unit_price, subtotal
            ) VALUES (
                v_transaction_id, (v_item->>'item_id')::uuid, 'retail', 
                v_item->>'item_name', v_qty, (v_item->>'unit_price')::numeric, (v_item->>'subtotal')::numeric
            );

        -- CASE B: BARANG SEWA SATUAN
        ELSIF v_item->>'type' = 'rental' THEN
            -- Cari fisik aset (rental_assets) sejumlah Qty yang 'ready'
            FOR v_i IN 1..v_qty LOOP
                SELECT * INTO v_asset_record 
                FROM public.rental_assets 
                WHERE item_id = (v_item->>'item_id')::uuid AND status = 'ready'
                LIMIT 1 FOR UPDATE;

                IF NOT FOUND THEN
                    RAISE EXCEPTION 'Unit fisik tidak tersedia untuk disewa (Barang: %)', v_item->>'item_name';
                END IF;

                -- Update asset status
                UPDATE public.rental_assets SET status = 'rented', last_status_change = now() WHERE id = v_asset_record.id;

                -- Insert transaction item untuk SETIAP unit fisik
                INSERT INTO public.transaction_items (
                    transaction_id, item_id, rental_asset_id, type, item_name, quantity, unit_price, subtotal,
                    rental_start_date, rental_end_date, rental_days, rental_status
                ) VALUES (
                    v_transaction_id, (v_item->>'item_id')::uuid, v_asset_record.id, 'rental',
                    v_item->>'item_name' || ' (' || v_asset_record.asset_code || ')', 1, 
                    (v_item->>'unit_price')::numeric, 
                    (v_item->>'unit_price')::numeric, -- SUBTANTIAL CHANGE: Harga sewa tidak lagi dikali rental_days
                    (payload->>'rental_start_date')::date, (payload->>'rental_end_date')::date, (payload->>'rental_days')::int, 'active'
                );

                -- Insert booking (kalender ketersediaan)
                INSERT INTO public.bookings (
                    rental_asset_id, branch_id, start_date, end_date, status
                ) VALUES (
                    v_asset_record.id, (payload->>'branch_id')::uuid, (payload->>'rental_start_date')::date, (payload->>'rental_end_date')::date, 'active'
                );
            END LOOP;
        
        -- CASE C: PAKET BUNDLING SEWA
        ELSIF v_item->>'type' = 'package' THEN
            -- Insert Header Paket
            INSERT INTO public.transaction_items (
                transaction_id, package_id, type, item_name, quantity, unit_price, subtotal,
                rental_start_date, rental_end_date, rental_days, rental_status
            ) VALUES (
                v_transaction_id, (v_item->>'package_id')::uuid, 'package',
                v_item->>'item_name', v_qty, (v_item->>'unit_price')::numeric, (v_item->>'unit_price')::numeric * v_qty, -- SUBTANTIAL CHANGE: Harga paket tidak dikali rental_days
                (payload->>'rental_start_date')::date, (payload->>'rental_end_date')::date, (payload->>'rental_days')::int, 'active'
            );

            -- Cari tahu isi barang apa saja yang ada di dalam paket tersebut
            FOR v_pkg_item IN SELECT * FROM public.package_items WHERE package_id = (v_item->>'package_id')::uuid LOOP
                
                -- Alokasikan fisik aset sebanyak: (Qty Paket dikali Qty Item Dalam Paket)
                FOR v_i IN 1..(v_qty * v_pkg_item.quantity) LOOP
                    SELECT * INTO v_asset_record 
                    FROM public.rental_assets 
                    WHERE item_id = v_pkg_item.item_id AND status = 'ready'
                    LIMIT 1 FOR UPDATE;

                    IF NOT FOUND THEN
                        RAISE EXCEPTION 'Unit fisik untuk barang di dalam paket tidak tersedia';
                    END IF;

                    -- Update status aset menjadi disewa
                    UPDATE public.rental_assets SET status = 'rented', last_status_change = now() WHERE id = v_asset_record.id;

                    -- Insert sub-item (harga 0 karena sudah include di paket) untuk tracking fisik
                    INSERT INTO public.transaction_items (
                        transaction_id, package_id, item_id, rental_asset_id, type, item_name, quantity, unit_price, subtotal,
                        rental_start_date, rental_end_date, rental_days, rental_status
                    ) VALUES (
                        v_transaction_id, (v_item->>'package_id')::uuid, v_pkg_item.item_id, v_asset_record.id, 'package',
                        ' - [Isi Paket] ' || v_asset_record.asset_code, 1, 0, 0,
                        (payload->>'rental_start_date')::date, (payload->>'rental_end_date')::date, (payload->>'rental_days')::int, 'active'
                    );

                    -- Insert booking
                    INSERT INTO public.bookings (
                        rental_asset_id, branch_id, start_date, end_date, status
                    ) VALUES (
                        v_asset_record.id, (payload->>'branch_id')::uuid, (payload->>'rental_start_date')::date, (payload->>'rental_end_date')::date, 'active'
                    );
                END LOOP;
            END LOOP;

        END IF;
    END LOOP;

    RETURN json_build_object('success', true, 'transaction_id', v_transaction_id);
END;
$$;
