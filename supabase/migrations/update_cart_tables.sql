-- Remove the unique constraint from cart_items table
ALTER TABLE public.cart_items
DROP CONSTRAINT cart_items_user_id_product_ean_key;

