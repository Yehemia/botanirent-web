-- ============================================================
-- Migration 014: Trigger untuk sinkronisasi stock_available barang sewa
-- Sinkronisasi otomatis setiap kali ada unit fisik rental_assets bertambah, berkurang, atau berubah status
-- ============================================================

CREATE OR REPLACE FUNCTION sync_rental_item_stock_available()
RETURNS TRIGGER AS $$
DECLARE
    v_item_id uuid;
BEGIN
    -- Dapatkan item_id dari record baru atau lama
    v_item_id := COALESCE(NEW.item_id, OLD.item_id);

    -- Hitung jumlah aset yang berstatus 'ready' lalu update tabel items
    UPDATE public.items
    SET stock_available = (
        SELECT COUNT(*)
        FROM public.rental_assets
        WHERE item_id = v_item_id AND status = 'ready'
    )
    WHERE id = v_item_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Hapus trigger jika sudah ada sebelumnya untuk menghindari konflik
DROP TRIGGER IF EXISTS trg_sync_rental_item_stock_available ON public.rental_assets;

-- Buat trigger setelah insert, update status, update item_id, atau delete
CREATE TRIGGER trg_sync_rental_item_stock_available
AFTER INSERT OR UPDATE OF status, item_id OR DELETE
ON public.rental_assets
FOR EACH ROW
EXECUTE FUNCTION sync_rental_item_stock_available();

COMMENT ON FUNCTION sync_rental_item_stock_available() IS 'Sinkronisasi jumlah unit ready ke kolom stock_available di tabel items.';
