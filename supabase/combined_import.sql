-- Script import tự động có xử lý Biến thể và Tồn kho Lô
BEGIN;

-- Xóa toàn bộ dữ liệu giao dịch cũ để tránh lỗi khóa ngoại
TRUNCATE TABLE public.inventory_movements CASCADE;
TRUNCATE TABLE public.inventory_document_items CASCADE;
TRUNCATE TABLE public.inventory_documents CASCADE;
TRUNCATE TABLE public.order_items CASCADE;
TRUNCATE TABLE public.orders CASCADE;
TRUNCATE TABLE public.purchase_order_items CASCADE;
TRUNCATE TABLE public.purchase_orders CASCADE;

-- Xóa danh mục hàng hóa cũ
TRUNCATE TABLE public.product_batches CASCADE;
TRUNCATE TABLE public.product_units CASCADE;
TRUNCATE TABLE public.related_products CASCADE;
TRUNCATE TABLE public.products CASCADE;
TRUNCATE TABLE public.categories CASCADE;

INSERT INTO public.categories (id, name) VALUES ('6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'Thuốc');
INSERT INTO public.categories (id, name) VALUES ('5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'Thực phẩm chức năng');
INSERT INTO public.categories (id, name) VALUES ('f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'Vật tư y tế');
INSERT INTO public.categories (id, name) VALUES ('cdae30e0-9366-4a54-b2b0-4dc3776f8fe5', 'Mỹ Phẩm');
INSERT INTO public.categories (id, name) VALUES ('f59542da-6c03-46df-b056-7c26229ab118', 'Thuốc cắt liều');
INSERT INTO public.categories (id, name) VALUES ('6afa32c5-1630-49f2-9d0f-06168b96b389', 'Thuốc dùng ngoài');
INSERT INTO public.categories (id, name) VALUES ('1fdb2de8-78f6-45ef-82db-35677936ff2c', 'Kẹo ngậm');
INSERT INTO public.categories (id, name) VALUES ('598c238d-2790-45c2-be55-d1723fdf1179', 'Nước súc miệng');
INSERT INTO public.categories (id, name) VALUES ('32ed068b-bf63-4242-8f32-d4bde6b3956a', 'Thuốc mỡ tra mắt');
INSERT INTO public.categories (id, name) VALUES ('290d7875-db14-4fae-9b9e-7413022816c8', 'Thuốc nhỏ mắt');

INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('2844c31b-275d-4f04-8708-df86b6295d10', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP188041', NULL, 'Zopiclon', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('ff93cfc5-0eb5-480d-b740-8bad10dfacff', '2844c31b-275d-4f04-8708-df86b6295d10', 'viên', 1, true, 1300, 2000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('f99bae33-06f9-4f6c-b0a5-ed5181ddb7db', '2844c31b-275d-4f04-8708-df86b6295d10', '100125', '2028-02-24', 360, 1300);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('dbcfeaff-a723-4c3f-bc7e-38c251755b50', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP188038', NULL, 'Philclonestyl', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('f3db236d-ee7c-423e-8cd4-b3181604a141', 'dbcfeaff-a723-4c3f-bc7e-38c251755b50', 'viên', 1, true, 1039.5, 1500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('7a87d704-5217-4aa1-91d2-de3029e8f68f', 'dbcfeaff-a723-4c3f-bc7e-38c251755b50', '080326', '2029-03-19', 2000, 1039.5);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('0416633b-8cad-49c5-a442-593b260c956b', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP188035', NULL, 'Sắt Ông Ferro - Kids', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('a8eb0154-b8d2-4111-9037-0af4a93f4de5', '0416633b-8cad-49c5-a442-593b260c956b', 'Ống', 1, true, 3825, 7500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('ef150464-76f4-4990-8e10-ea2a2c728d12', '0416633b-8cad-49c5-a442-593b260c956b', '041225', '2028-12-07', 240, 3825);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('2974bab3-31a1-46d5-90c4-f5647ede02f1', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP188033', NULL, 'Dán Hạ Sốt Chikori', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('220b2d6c-a192-413a-b7da-c5d95e777636', '2974bab3-31a1-46d5-90c4-f5647ede02f1', 'Gói', 1, true, 9800, 12000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('ed5fce14-a8af-449e-aa4f-769c0bfa4108', '2974bab3-31a1-46d5-90c4-f5647ede02f1', '030126', '2029-01-02', 75, 9800);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('b87ad089-5c2c-47fe-8348-bef7c0552dbf', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP188032', NULL, 'Tăm Bông Tốt', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('e8a15509-5cfb-4112-a114-f7d3ce965e04', 'b87ad089-5c2c-47fe-8348-bef7c0552dbf', 'Gói', 1, true, 4200, 7000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('90b555de-8351-4071-a693-7e2727c6f6a4', 'b87ad089-5c2c-47fe-8348-bef7c0552dbf', '12/2025', '2028-12-30', 12, 4200);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('dca4a753-e8be-459e-bbc6-2fc5d8db8192', 'cdae30e0-9366-4a54-b2b0-4dc3776f8fe5', 'SP188031', NULL, 'Cao bạch hổ', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('6ec53cad-738f-4ac1-bd3c-ef3c80297a9d', 'dca4a753-e8be-459e-bbc6-2fc5d8db8192', 'Hộp', 1, true, 0, 25000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                VALUES ('085ddba4-747c-4c93-b012-5eeead9be28a', 'dca4a753-e8be-459e-bbc6-2fc5d8db8192', 'LO-MACDINH', '2099-12-31', 1, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('90622fa5-5544-4387-bdb0-387e5ff9d940', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP188030', NULL, 'Siro ho (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('bb3d8642-4b28-4b2c-84b8-4adc59ae30aa', '90622fa5-5544-4387-bdb0-387e5ff9d940', 'Gói', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('c9b36052-590e-4bda-956f-e2b22bb390df', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP188029', NULL, 'Sulpiride 50mg (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('e83a7d29-bb40-4a59-93d3-0c2b33d60f36', 'c9b36052-590e-4bda-956f-e2b22bb390df', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('664450e6-76d8-4649-bd17-66b825d51b2d', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP188028', NULL, 'Homtamin gingseng (cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('855bcc7c-ec6a-4052-a414-013975d5237e', '664450e6-76d8-4649-bd17-66b825d51b2d', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('20887e02-a7fc-4a8e-8cf7-c10036136932', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP188027', NULL, 'Celecoxib (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('ec1e4263-6c59-470c-ad98-e8ac16dee7ae', '20887e02-a7fc-4a8e-8cf7-c10036136932', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('99222040-f60b-4ba2-8887-fcd3a315045e', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP188026', NULL, 'Ho xanh (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('649a6e7e-ce38-4396-a93c-ad902342290a', '99222040-f60b-4ba2-8887-fcd3a315045e', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('1f9633ce-7896-4106-9be9-f696350de5a2', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP188025', NULL, 'Amoxicillin 500mg + Acid clavulanic 62.5mg (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('4475a5a1-2528-4798-b8b9-577dbfacbbc8', '1f9633ce-7896-4106-9be9-f696350de5a2', 'Gói', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('a375d0ef-b641-44d8-8c66-dd81dd259423', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP188024', NULL, 'Amoxicillin 250mg + Acid clavulanic 31.25mg (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('37a4781a-8264-474e-8471-b494c11acbe5', 'a375d0ef-b641-44d8-8c66-dd81dd259423', 'Gói', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('95693626-4bcd-4114-b7a8-7dd2d6c78697', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP188023', NULL, 'Cephalexin 500mg (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('042f1dc3-fb03-4e81-86a3-a1c37bbcd378', '95693626-4bcd-4114-b7a8-7dd2d6c78697', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('ab67a46f-d5c6-4309-84ac-f476314b4a0c', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP188022', NULL, 'Eperison (cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('c324c097-2201-4047-b55a-2bd010fda21c', 'ab67a46f-d5c6-4309-84ac-f476314b4a0c', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('17c9ad38-bca3-424a-9574-add07e3e2776', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP188021', NULL, 'Cefixime 100mg GÓI (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('e52d2eb1-b5c6-4461-8da9-7c6441662bd5', '17c9ad38-bca3-424a-9574-add07e3e2776', 'Gói', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d2f7c4f1-0fad-4973-b644-949d702e7911', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP188020', NULL, 'Cefixime 100mg VIÊN (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('6aa56a5a-5374-407e-b6eb-21c2dec3b583', 'd2f7c4f1-0fad-4973-b644-949d702e7911', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('380dcf53-9ff5-444f-8cdf-857bdb11bf7c', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP188019', NULL, 'Cefixime 200mg (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('73201d81-5d82-447d-8fb1-abafe04eb70a', '380dcf53-9ff5-444f-8cdf-857bdb11bf7c', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('2f65f101-3560-497e-9fa8-c78e1acc673d', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP188018', NULL, 'Betamethason 0.25mg + Dexclorpheniramine maleate 2mg (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('39732c04-0f5d-40d4-83b3-0debf4a82b53', '2f65f101-3560-497e-9fa8-c78e1acc673d', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('26ea71c6-5f85-4cd3-97a4-b0b7247bd9be', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP188017', NULL, 'Cotrim (Cắt Liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('7d168684-33e6-4ad1-ba87-1d94a5438616', '26ea71c6-5f85-4cd3-97a4-b0b7247bd9be', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('2df04892-e759-4301-9f2a-9ee22ac028c7', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP188016', NULL, 'Clindamycin 300mg (Cắt Liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('604f2d59-ad54-428f-bfb2-dcf8d22518cf', '2df04892-e759-4301-9f2a-9ee22ac028c7', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('9dcdfa66-f1dc-4da4-a5ea-68fe27820d9f', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP188015', NULL, 'Alphachymotrypsin 4200 (Cắt Liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('070c3bb8-6706-485d-8f98-0682264aefc0', '9dcdfa66-f1dc-4da4-a5ea-68fe27820d9f', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('f402feed-1a7b-4ffb-baa2-315c2fbc82ac', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP188014', NULL, 'Acid mefenamic 500mg (Cắt Liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('5fe9a384-bfff-465b-94b5-8ede629625a4', 'f402feed-1a7b-4ffb-baa2-315c2fbc82ac', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('a4b29689-123a-4989-84d1-0aa0c852609c', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP188013', NULL, 'Cà gai leo (Cắt Liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('8270b655-c2e0-4aa3-a3c8-3a2bfc279d4e', 'a4b29689-123a-4989-84d1-0aa0c852609c', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('48e651ba-2242-4e8f-b977-f2fda2b914be', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP188012', NULL, 'Lincomycin (Cắt Liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('30ea7e4d-4b04-4b04-a017-8064ed0bc9bb', '48e651ba-2242-4e8f-b977-f2fda2b914be', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('74bc89bd-916f-4c8e-9cc4-cd5c4ad2bc3d', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP188011', NULL, 'Paracetamol 500mg + Phenylephrin 10mg + Loratadin 5mg (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('4d2b432c-6256-469f-bc94-94b1951d3a61', '74bc89bd-916f-4c8e-9cc4-cd5c4ad2bc3d', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('9e66339a-5f57-41fa-8baa-2dd4b4de2282', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP188010', NULL, 'Prednisolon 5mg (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('aa6d89b1-3dfe-450a-ad3f-bca382e9195b', '9e66339a-5f57-41fa-8baa-2dd4b4de2282', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('a9d5c35d-78eb-4acf-9fa0-bf8fa6c0da87', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP188009', NULL, 'Allopurinol (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('d20bc397-62d5-4e29-bb90-c45d27e15dd9', 'a9d5c35d-78eb-4acf-9fa0-bf8fa6c0da87', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('fee03988-1cf9-45b0-b101-3edf79e80bf3', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP188008', NULL, 'Paracetamol 500mg + Codein 30mg (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('206a0b87-8b2d-44b7-812c-514f5b59edf7', 'fee03988-1cf9-45b0-b101-3edf79e80bf3', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('40355cf4-b1ea-438d-ab67-9aa42999ca29', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP188007', NULL, 'Paracetamol 250 (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('eb6c3e82-91a8-48ac-894d-235a60bfb5d3', '40355cf4-b1ea-438d-ab67-9aa42999ca29', 'Gói', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('0918ec89-5596-4638-ae4b-6eeff1020563', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP188006', NULL, 'Paracetamol 650 (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('76563b2a-54ca-4932-aa83-ac16185401b2', '0918ec89-5596-4638-ae4b-6eeff1020563', 'Viên', 1, true, 538.65, 0);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('73bfdc42-f667-4aef-81db-596b699209e6', '0918ec89-5596-4638-ae4b-6eeff1020563', '251225', '2029-01-04', 800, 538.65);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('7c6a4c9a-66a6-4cbf-bd1b-927e5d4efe8b', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP188005', NULL, 'Paracetamol 500 (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('44cd7f00-443b-4fa4-8762-af2de0631f71', '7c6a4c9a-66a6-4cbf-bd1b-927e5d4efe8b', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('4c0dce81-70b7-4b79-a33b-983724ef8f66', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP188004', NULL, 'Paracetamol 150 (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('4eb2895d-04d2-4316-879e-084c3ffe9a34', '4c0dce81-70b7-4b79-a33b-983724ef8f66', 'Gói', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d14816da-440d-4b69-a2c4-1c96d21fb80b', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP188003', NULL, 'Methylprednisolon 4mg (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('ed3b054a-a92b-4ba7-9e18-c6ad571bfa1b', 'd14816da-440d-4b69-a2c4-1c96d21fb80b', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('6e70ccc0-6838-44a2-9675-a83610b999d2', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP188002', NULL, 'Methylprednisolon 16mg (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('a1eaa37d-dfa8-45d5-b5de-0ba44683e20c', '6e70ccc0-6838-44a2-9675-a83610b999d2', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('faad39c2-5b9b-4027-b3f2-cb9dce949083', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP188001', NULL, 'Paracetamol +Tramadol (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('be0ad341-ea15-44c8-8e62-7b08bac7334c', 'faad39c2-5b9b-4027-b3f2-cb9dce949083', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('73369ca1-629d-4695-b495-3ed0a09cc6c6', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP188000', NULL, 'Vitamin PP (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('03a872f1-07e6-46f6-aeff-d9f1323c1e07', '73369ca1-629d-4695-b495-3ed0a09cc6c6', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('801b8a9b-00f5-4791-9a05-0a71d06d1bc1', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP187999', NULL, 'Vitamin AD (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('2992fc31-6a01-4242-b91e-73e1075901c3', '801b8a9b-00f5-4791-9a05-0a71d06d1bc1', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('77eff031-5e5e-4550-bb62-0fc0526dc581', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP187998', NULL, 'Vitamin 3B (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('ff059876-97a1-44fd-b643-94ca9dcf5e31', '77eff031-5e5e-4550-bb62-0fc0526dc581', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('2b47295e-f0e4-4cad-9e37-c1931970b6cd', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP187997', NULL, 'Magnesium B6 (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('69aafc4d-b02e-4a49-b34c-115ba2c337ab', '2b47295e-f0e4-4cad-9e37-c1931970b6cd', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('aedb8053-0304-4423-a172-8ace7db6f972', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP187996', NULL, 'Calci (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('f627020e-75b4-499f-949d-11a5b1e4cde4', 'aedb8053-0304-4423-a172-8ace7db6f972', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('7c8d61db-7a89-4640-bb71-7aa6cc3b0463', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP187995', NULL, 'BC Complex (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('ee880057-d358-4a9a-a628-fab3e8379432', '7c8d61db-7a89-4640-bb71-7aa6cc3b0463', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('6bde2719-31a9-49ce-943a-7541a1cd883e', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP187994', NULL, 'Simethicon 80mg (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('c0c83a25-7662-4ce5-899d-5d7ff24b0457', '6bde2719-31a9-49ce-943a-7541a1cd883e', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('8333fc27-6e6f-4886-976d-45f3afe0afeb', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP187993', NULL, 'Omeprazol 20 (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('d1fa32f4-f0f1-4cdb-b52b-f49c511b3185', '8333fc27-6e6f-4886-976d-45f3afe0afeb', 'viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('c37be70e-2189-422b-8d59-83848885b39a', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP187992', NULL, 'Esomeprazol (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('666a3902-9031-4d95-bdd7-b7845b3cfd82', 'c37be70e-2189-422b-8d59-83848885b39a', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('70d24f90-428f-45e9-bd21-c640542ce2a9', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP187991', NULL, 'Domperidone 10mg (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('bc317a4f-b9b6-437e-8265-23e37e7454c2', '70d24f90-428f-45e9-bd21-c640542ce2a9', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('75053ff7-4ddd-467c-b302-9e11ced93a5d', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP187990', NULL, 'Domperidone 5mg (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('b2108762-5c2f-4744-8572-3fbec9db3335', '75053ff7-4ddd-467c-b302-9e11ced93a5d', 'Gói', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('25def872-b0cb-4a2a-9025-1af4b8a05b6c', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP187989', NULL, 'Diosmectit 3g (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('5a4eab2d-09f1-419e-86d6-318b923f5bc0', '25def872-b0cb-4a2a-9025-1af4b8a05b6c', 'Gói', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('86d77c98-a2e5-4430-b8d3-e5f67a1deee1', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP187988', NULL, 'Alverin citrat (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('7f655c36-e4a9-4150-a3b3-a5a9dc1cd016', '86d77c98-a2e5-4430-b8d3-e5f67a1deee1', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('b3657c5b-3f7a-45cc-b6f0-d885bb03b364', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP187987', NULL, 'Piracetam (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('6334dad6-68ac-4a29-80bd-5a31740b8cd8', 'b3657c5b-3f7a-45cc-b6f0-d885bb03b364', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('6d3a457d-ebde-45f9-b40d-ab9accb94904', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP187986', NULL, 'diphenhydramine (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('2b79e620-7f45-4d11-bc03-4152450509ec', '6d3a457d-ebde-45f9-b40d-ab9accb94904', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('7c56078b-882a-42d7-bcff-7a2d2e6e2ddb', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP187985', NULL, 'Cinnarizine (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('c99fb54e-a884-4a50-b154-b534c8724fa8', '7c56078b-882a-42d7-bcff-7a2d2e6e2ddb', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('38c94632-c32e-40e3-b6b1-d7a304e72182', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP187984', NULL, 'Montelukast (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('0c2704e4-7844-4b57-b0b7-87176a60c2f7', '38c94632-c32e-40e3-b6b1-d7a304e72182', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('04241562-e902-48b4-9e00-7be4ba0f5849', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP187983', NULL, 'Midasol (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('1b734ae4-8d8d-40aa-80ba-f3ff3631b397', '04241562-e902-48b4-9e00-7be4ba0f5849', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('f29c3894-4a15-4ed4-9f88-9d4e8f7bb7e3', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP187982', NULL, 'Flunarizine (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('25a3ea82-bb43-44fc-9d4f-cd2c399fc1ac', 'f29c3894-4a15-4ed4-9f88-9d4e8f7bb7e3', 'viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('9711f187-8bc4-4607-a3b5-ca399e29ad49', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP187981', NULL, 'Salbutamol (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('72a4bd10-6d96-443e-98d4-72c0f3309727', '9711f187-8bc4-4607-a3b5-ca399e29ad49', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('ce9d915e-5efe-41f3-ad71-ad05ae198e7b', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP187980', NULL, 'Men vi sinh (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('39646ac9-c071-4c42-8623-d2185893a431', 'ce9d915e-5efe-41f3-ad71-ad05ae198e7b', 'Gói', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('f042c455-a235-413c-b9eb-e4b33064d224', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP187979', NULL, 'Loperamide 2mg (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('f2022999-c108-4f58-b8e7-2857b2ec4c85', 'f042c455-a235-413c-b9eb-e4b33064d224', 'viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('80f1c056-5398-4762-95f4-5b971f9633aa', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP187978', NULL, 'Desloratadine (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('0a80bb40-6f22-415c-bc37-d00d925eec01', '80f1c056-5398-4762-95f4-5b971f9633aa', 'Gói', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('4d93fda5-7f50-4ca6-a488-8abef508f694', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP187977', NULL, 'Chlorpheniramine 4mg (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('9b46c28a-e8cf-405e-a5df-b29b5a24bcfb', '4d93fda5-7f50-4ca6-a488-8abef508f694', 'viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('8e91f947-22fd-4ee5-8513-79726c042158', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP187976', NULL, 'Cetirizine (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('80092eb1-c8f1-45f1-b360-f2e45f6efa90', '8e91f947-22fd-4ee5-8513-79726c042158', 'viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('3d4bbd6d-aa69-4f6a-b9cb-7824ddfca579', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP187975', NULL, 'Bromhexin 8 (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('c21ac2ce-24fe-47c6-af75-5b55b27406e5', '3d4bbd6d-aa69-4f6a-b9cb-7824ddfca579', 'viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('7a093b6a-ce5a-4085-b342-45e123b62305', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP187974', NULL, 'Alimemazin (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('29cd4fc0-5a44-4138-be04-3b55c42a3330', '7a093b6a-ce5a-4085-b342-45e123b62305', 'viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('13995a4e-6922-40f8-bacc-b146aafdfb4a', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP187973', NULL, 'Acetylcystein 200mg (Gói) (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('de706b1b-fd15-4be4-b764-284eb179c175', '13995a4e-6922-40f8-bacc-b146aafdfb4a', 'Gói', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('46da20e2-9b6b-4102-872d-946e1cafc9a9', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP187968', NULL, 'Aspirin hộp trắng', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('3981c36c-5f39-4617-bd20-613adee10573', '46da20e2-9b6b-4102-872d-946e1cafc9a9', 'viên', 1, true, 0, 0);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('b814e527-1f93-46d2-996f-2d6f621b0d36', '46da20e2-9b6b-4102-872d-946e1cafc9a9', '1111', '2028-01-01', 600, 0);
INSERT INTO public.products (id, category_id, product_code, name, is_active, is_direct_sale) 
                        VALUES ('adf3126f-fbe7-4be2-b87a-d0b41fe2bc64', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'PARENT_HAPACOL', 'Hapacol', true, false);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('9f4e8bfe-f045-4ba2-8d9b-4a2818e7043d', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP187965', NULL, 'Hapacol 650 h/100v DHG', true, 'adf3126f-fbe7-4be2-b87a-d0b41fe2bc64', '650 h/100v DHG');
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('ea2468b1-196a-457e-9e5d-51eb204feaa9', '9f4e8bfe-f045-4ba2-8d9b-4a2818e7043d', 'viên', 1, true, 592, 800);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('e73569f4-c61a-477e-a55c-7389e79e00cb', '9f4e8bfe-f045-4ba2-8d9b-4a2818e7043d', '240126', '2029-01-22', 370, 592);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('8765e33d-8d2d-4c0c-bd0c-578356ae1165', '6afa32c5-1630-49f2-9d0f-06168b96b389', 'SP187964', NULL, 'Bosmovat 10g', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('0e64d5ad-5f69-4efa-b321-60c7a3d8c1b5', '8765e33d-8d2d-4c0c-bd0c-578356ae1165', 'Tuýp', 1, true, 15238, 25000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('172e56eb-3613-4556-95b5-510ce0bf8981', '8765e33d-8d2d-4c0c-bd0c-578356ae1165', '061125', '2028-11-21', 3, 15238);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('909dd8bc-cd32-4f5b-b8ba-6801721323a6', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP187960', NULL, 'Acetylcystein 200mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('49f5aeac-4320-478f-a767-470fd51eecd6', '909dd8bc-cd32-4f5b-b8ba-6801721323a6', 'Viên', 1, true, 0, 1000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                VALUES ('57641f89-6d8e-40e4-b4ee-213833b49e9f', '909dd8bc-cd32-4f5b-b8ba-6801721323a6', 'LO-MACDINH', '2099-12-31', 90, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('27f02204-98ff-4c99-acd2-4877d852561e', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP187957', NULL, 'Ceridon', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('55b9d0d8-b49e-4a75-9e05-1604758b16a4', '27f02204-98ff-4c99-acd2-4877d852561e', 'Viên', 1, true, 0, 1000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                VALUES ('b1a1e999-dbf6-4c0f-a81c-940263fdf275', '27f02204-98ff-4c99-acd2-4877d852561e', 'LO-MACDINH', '2099-12-31', 590, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('893c1521-5a81-4ec6-b910-eb6432b474aa', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP187956', NULL, 'Plus C', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('b23c1d21-7118-4717-98d4-bf21f4fbb794', '893c1521-5a81-4ec6-b910-eb6432b474aa', 'Tuýp', 1, true, 9500, 40000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('8034d4e3-f299-40d7-bc91-365925935ab2', '893c1521-5a81-4ec6-b910-eb6432b474aa', '011025', '2028-10-15', 40, 9500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('49425fc8-a2b1-493e-8871-c6885ba83e49', '1fdb2de8-78f6-45ef-82db-35677936ff2c', 'SP187954', NULL, 'Kẹo Chanh Gừng Ô Mai', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('59e3b676-d1ae-483a-8fe4-ee36e47b3470', '49425fc8-a2b1-493e-8871-c6885ba83e49', 'Vỉ', 1, true, 9000, 15000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('a2c92ca4-067e-4dd4-b807-4383b3dfa1fd', '49425fc8-a2b1-493e-8871-c6885ba83e49', '020126', '2028-01-01', 13, 9000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('752dedc8-ead2-4128-b03b-8705f2819a2b', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP187946', NULL, 'Bông 10g', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('9125af60-d30a-4ebc-b214-5e9490e23fea', '752dedc8-ead2-4128-b03b-8705f2819a2b', 'Gói', 1, true, 3500, 5000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                VALUES ('afa8de75-d789-49ca-937b-dea8cee1b757', '752dedc8-ead2-4128-b03b-8705f2819a2b', 'LO-MACDINH', '2099-12-31', 23, 3500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('789ec14d-b7d1-4f75-803d-741cb528ad56', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP187944', NULL, 'Viên đặt âm đạo Vaginapoly', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('722c4bc9-3475-43d3-98a1-84b4d8fa3d7a', '789ec14d-b7d1-4f75-803d-741cb528ad56', 'viên', 1, true, 5669.7, 6500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('336d5b35-6cea-4f1c-a289-407b5ae1610a', '789ec14d-b7d1-4f75-803d-741cb528ad56', '25008', '2027-10-14', 18, 5669.7);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('7dea7715-8529-4c77-b6e1-9e46cbc00999', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP187943', NULL, 'Thuốc liều 12k', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('1be73b85-2f00-476e-93e4-6b3f12a6698b', '7dea7715-8529-4c77-b6e1-9e46cbc00999', 'Viên', 1, true, 0, 12000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('44f26412-5f9a-43a5-9c20-dbdc158dd2c2', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP187932', NULL, 'Spacmarizine', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('adb80229-402c-4da7-ad8f-a3bd8704d5d3', '44f26412-5f9a-43a5-9c20-dbdc158dd2c2', 'Viên', 1, true, 300, 500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('989c8132-429e-4b3a-9e06-593db1f6fb35', '44f26412-5f9a-43a5-9c20-dbdc158dd2c2', '021-081024', '2027-10-08', 1340, 300);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('e659919e-8fa4-4c0f-b6c7-e82472804c54', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', '8936058820050', '8936058820050', 'Eskar xanh', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('20e92612-564a-43e8-b712-d7657762c23e', 'e659919e-8fa4-4c0f-b6c7-e82472804c54', 'chai', 1, true, 21000, 25000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('27572b2a-691b-41cd-9238-cb4dc45bf400', 'e659919e-8fa4-4c0f-b6c7-e82472804c54', '1281125', '2027-11-28', 2, 21000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('e9bea8ea-cb3d-409d-aecb-439d7f415c27', '6afa32c5-1630-49f2-9d0f-06168b96b389', 'SP187928', NULL, 'Dầu khuynh diệp Family', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('7471ea66-e63b-44a2-87b3-9c772e59e655', 'e9bea8ea-cb3d-409d-aecb-439d7f415c27', 'Chai', 1, true, 37500, 50000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('2a1904c3-d285-41a7-b705-8bba6859e7df', 'e9bea8ea-cb3d-409d-aecb-439d7f415c27', '150525', '2030-05-14', 2, 37500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d209d335-0d4d-4e04-a20f-de3f54157f7f', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP187925', NULL, 'ImoBoston', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('cf35c90a-a201-40ea-90b5-c80fe437f5de', 'd209d335-0d4d-4e04-a20f-de3f54157f7f', 'Viên', 1, true, 430, 600);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('fa1ebaf2-decf-4af5-aa36-546ed738987f', 'd209d335-0d4d-4e04-a20f-de3f54157f7f', '060825', '2028-09-04', 180, 430);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('1c7d7533-c8d9-498f-a507-c9bb4cb691eb', 'd209d335-0d4d-4e04-a20f-de3f54157f7f', '091225', '2029-01-08', 1000, 430);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('a21b49d7-8a4b-4827-8901-10c439cb970e', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', '8858992502987', '8858992502987', 'Tradolgesic h/100', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('1a7bba12-ed17-4738-8219-bca573773fdb', 'a21b49d7-8a4b-4827-8901-10c439cb970e', 'Viên', 1, true, 1800, 6000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('69f85344-c463-4f5a-9702-148fb296a485', 'a21b49d7-8a4b-4827-8901-10c439cb970e', '1111', '2028-01-01', 894, 1800);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('e2602a85-e544-4ec8-a308-e86fd06cc2bd', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP187920', NULL, 'Novomycine 3MIU', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('c80fc1b4-fec6-407c-bd4c-c34e56f4424d', 'e2602a85-e544-4ec8-a308-e86fd06cc2bd', 'Viên', 1, true, 4680, 6000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('347128fa-84bd-4cbd-ba4d-c04c7ba66f3b', 'e2602a85-e544-4ec8-a308-e86fd06cc2bd', '25005HN', '2028-08-28', 10, 4680);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('295eed30-1ea9-436a-8b71-d163ed45e530', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP187911', NULL, 'Urgo cho vết thương bỏng', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('47c3b1d9-077e-4e71-95d0-c8765d89a860', '295eed30-1ea9-436a-8b71-d163ed45e530', 'Miếng', 1, true, 22500, 25000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('53281cd1-d1b6-44bd-ace8-3a0b41580135', '295eed30-1ea9-436a-8b71-d163ed45e530', '41195', '2028-09-30', 5, 22500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('45de8871-2528-43ab-ac9c-156a7b91c78b', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP187909', NULL, 'Găng tay Nitrile', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('c58211f9-c018-40cb-aaab-d4372ea77cb0', '45de8871-2528-43ab-ac9c-156a7b91c78b', 'Cái', 1, true, 690, 1000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('c33dc1ec-954b-4bb9-b89b-502a9fcf5386', '45de8871-2528-43ab-ac9c-156a7b91c78b', 'SSG2512044', '2028-11-30', 960, 690);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('c2e5eb54-8170-48f4-bf50-0356909b601e', 'cdae30e0-9366-4a54-b2b0-4dc3776f8fe5', 'SP187908', NULL, 'Munderm', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('577bdc9b-8415-42d7-927f-7bf7008bdbb4', 'c2e5eb54-8170-48f4-bf50-0356909b601e', 'Tuýp', 1, true, 200000, 0);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('30826979-a17a-441f-89dc-5329a45cb997', 'c2e5eb54-8170-48f4-bf50-0356909b601e', '542035', '2027-07-01', 67, 200000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('c9d6ffa9-bdce-4c12-a1b8-e8b061995cc6', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP187902', NULL, 'Oracortia', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('3d277f04-42b2-44ee-993a-c7b2b96c44c9', 'c9d6ffa9-bdce-4c12-a1b8-e8b061995cc6', 'Gói', 1, true, 9848.27, 12000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('3aa600d3-7ce5-400e-b712-8a0afd73d40b', 'c9d6ffa9-bdce-4c12-a1b8-e8b061995cc6', '1141125', '2028-11-20', 40, 9848.27);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('42789495-3c9e-40fe-80e2-fe02c8388c56', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP187885', NULL, 'Terp-cod', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('7e0464a2-ca97-41f7-a41b-ccea8a03fa37', '42789495-3c9e-40fe-80e2-fe02c8388c56', 'Viên', 1, true, 1100, 2000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('6310e8ff-7dd4-4d48-a91e-81e8b802d4e8', '42789495-3c9e-40fe-80e2-fe02c8388c56', '0010126', '2029-01-08', 1839, 1100);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('e00edc59-e2e1-46f7-b444-099ff5cf8aa8', 'cdae30e0-9366-4a54-b2b0-4dc3776f8fe5', 'SP187882', NULL, 'Acuroff', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('e86d8db3-97fc-4b21-a6d5-b3e0e28a6695', 'e00edc59-e2e1-46f7-b444-099ff5cf8aa8', 'viên', 1, true, 3500, 6000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('65694b0c-7994-4c79-9ce1-7e654a3a09ab', 'e00edc59-e2e1-46f7-b444-099ff5cf8aa8', '25510576', '2027-10-04', 1180, 3500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('3e5d6fc4-a661-4cd9-a800-d3be96d26b21', '1fdb2de8-78f6-45ef-82db-35677936ff2c', 'SP187879', NULL, 'Kẹo ngậm ho bách bộ', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('81f3505a-495b-4967-abf8-51e8d4a11fa8', '3e5d6fc4-a661-4cd9-a800-d3be96d26b21', 'Viên', 1, true, 1380, 2600);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('23035686-a80e-4578-b7a6-a547d58053e5', '3e5d6fc4-a661-4cd9-a800-d3be96d26b21', '1225', '2027-12-27', 0, 1380);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('12a39d26-b0e9-49cf-96d5-58d0485e4cfa', '3e5d6fc4-a661-4cd9-a800-d3be96d26b21', '020126', '2028-01-01', 190, 1380);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('560af330-e6a8-4e83-8028-2ee97b3ad70b', 'cdae30e0-9366-4a54-b2b0-4dc3776f8fe5', 'SP187876', NULL, 'Xà bông permethrin', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('c7c32100-52cc-45ab-b627-058edbeaf716', '560af330-e6a8-4e83-8028-2ee97b3ad70b', 'hộp', 1, true, 85000, 0);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                VALUES ('4e01b674-397e-4fa7-87d5-a5de95a7b35b', '560af330-e6a8-4e83-8028-2ee97b3ad70b', 'LO-MACDINH', '2099-12-31', 5, 85000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('14bd8727-7e7b-47e4-815e-213fdcac164c', 'cdae30e0-9366-4a54-b2b0-4dc3776f8fe5', 'SP187875', NULL, 'Tazret 0.1%', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('d06ad224-e1a5-41b1-9d18-54d303dc65d3', '14bd8727-7e7b-47e4-815e-213fdcac164c', 'tuýp', 1, true, 170000, 0);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                VALUES ('c7815a42-3476-49bf-8a8f-cfaaf4afa29f', '14bd8727-7e7b-47e4-815e-213fdcac164c', 'LO-MACDINH', '2099-12-31', 8, 170000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('43d457ee-d61d-403b-96ec-d9d92c9ef864', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP187872', NULL, 'Dognefin 50mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('c71e192d-ba48-4464-a099-1cd2f6430af0', '43d457ee-d61d-403b-96ec-d9d92c9ef864', 'Viên', 1, true, 1000, 1500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('8798ff8a-99eb-42e0-8e8f-c810b6793191', '43d457ee-d61d-403b-96ec-d9d92c9ef864', '301124', '2027-11-16', 43, 1000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('f97bec95-50b1-44b1-af9e-0da8b9f75587', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP187866', NULL, 'Máy đo huyết áp Wrist electronic', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('c454b352-58d8-4e03-ba48-b882c2336fd9', 'f97bec95-50b1-44b1-af9e-0da8b9f75587', 'Cái', 1, true, 150000, 300000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('e424875e-4222-4706-9903-fafc25b2c6b2', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP187865', NULL, 'Berberin', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('f6e5d08b-0edf-4a86-be7b-85cce8d819c0', 'e424875e-4222-4706-9903-fafc25b2c6b2', 'Hộp', 1, true, 0, 20000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('3ab860ec-690e-44d9-bfcd-0d5d201a80c4', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP187858', NULL, 'Alanboss', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('f7d53582-f682-40f5-bc86-950f7a3f32f6', '3ab860ec-690e-44d9-bfcd-0d5d201a80c4', 'Viên', 1, true, 7333, 9000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('03fd344d-a3ad-4ff8-ade0-217898ace41d', '3ab860ec-690e-44d9-bfcd-0d5d201a80c4', '01325', '2028-10-08', 70, 7333);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d394fb22-5807-4c96-ba71-23400dea4cf9', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP187855', NULL, 'IHYBES-H 150', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('dc969ed5-144e-46fa-9972-9083ba4c255e', 'd394fb22-5807-4c96-ba71-23400dea4cf9', 'Viên', 1, true, 1300, 2500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('340b3e3b-f3cf-4377-a987-92e10ccc9f99', 'd394fb22-5807-4c96-ba71-23400dea4cf9', '080725', '2028-07-22', 0, 1300);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('014011fa-ce86-4f42-989e-93c84d9178a6', 'd394fb22-5807-4c96-ba71-23400dea4cf9', '121125', '2028-11-13', 60, 1300);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('2681eb25-d13d-47ad-b30f-a81c8ae0a415', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP187852', NULL, 'IHYBES 150', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('ca673205-f01f-4152-9fca-cd8cf259bc8e', '2681eb25-d13d-47ad-b30f-a81c8ae0a415', 'Viên', 1, true, 1000, 2000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('91471050-613c-4b65-8221-09ffbc1635df', '2681eb25-d13d-47ad-b30f-a81c8ae0a415', '040625', '2028-07-02', 20, 1000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('c1216f50-c8b5-4790-a893-4cb7f178ba9f', '2681eb25-d13d-47ad-b30f-a81c8ae0a415', '060925', '2028-10-01', 60, 1000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('719d025c-5022-4df6-bdf1-9f155b5daba9', 'cdae30e0-9366-4a54-b2b0-4dc3776f8fe5', 'SP187844', NULL, 'Premiscab lotion', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('316747dd-68b3-470b-a49b-38d03991f7c9', '719d025c-5022-4df6-bdf1-9f155b5daba9', 'tuýp', 1, true, 85000, 0);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                VALUES ('d5621962-7641-4929-9449-735784f2dee8', '719d025c-5022-4df6-bdf1-9f155b5daba9', 'LO-MACDINH', '2099-12-31', 5, 85000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('ca2b231e-6498-4a2e-999a-906f54b78270', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP187841', NULL, 'Clyodas 300', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('fcba970b-f214-42d7-8c30-fa8eb62442a1', 'ca2b231e-6498-4a2e-999a-906f54b78270', 'Viên', 1, true, 2450, 3000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('11bc784c-ed8b-4bcf-99e0-0e62b5a62064', 'ca2b231e-6498-4a2e-999a-906f54b78270', '25004', '2028-10-02', 0, 2450);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('21601c6c-7e9e-43e5-9e1f-f789ffc35633', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP187832', NULL, 'Mật Ong Nghê Y Phúc', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('26079d05-cfbe-44d8-ac68-e32912b9296e', '21601c6c-7e9e-43e5-9e1f-f789ffc35633', 'Gói', 1, true, 5780, 8000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('f75b3c8c-8e69-4d2b-8f5f-c547ce3970e8', '21601c6c-7e9e-43e5-9e1f-f789ffc35633', '011025', '2028-10-07', 0, 5780);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('1be53f14-7fc2-4796-b6e9-d9d0be8b0211', '21601c6c-7e9e-43e5-9e1f-f789ffc35633', '011125', '2028-11-02', 0, 5780);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('111c146e-b58f-46ee-9fb2-18a0f699aa7c', '21601c6c-7e9e-43e5-9e1f-f789ffc35633', '010226', '2029-02-03', 239, 5780);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('79b6bf65-000f-4a64-971e-f7277bb4e14e', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP187830', NULL, 'Trà Gừng', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('dd6d9bb5-69be-4932-bdf6-51945902d514', '79b6bf65-000f-4a64-971e-f7277bb4e14e', 'Gói', 1, true, 1000, 2000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('7e040fff-b696-49d3-935f-0859d793b510', '79b6bf65-000f-4a64-971e-f7277bb4e14e', '0225', '2028-07-09', 78, 1000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('3fd854dd-2a90-4c27-986b-1c7ac092e199', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP187827', '8936021810798', 'Cảm Xuyên Hương', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('f6828466-9551-4460-8d8a-ce78bcd4f6e1', '3fd854dd-2a90-4c27-986b-1c7ac092e199', 'Viên', 1, true, 500, 1000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('654f6d97-7536-485d-b12b-13dee0de0ef8', '3fd854dd-2a90-4c27-986b-1c7ac092e199', '3624', '2027-09-10', 130, 500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('0ba1249e-e3b6-4d64-aac6-244ccaa4b344', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP187826', '8934574091312', 'Viên nghệ mekophar', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('8dc5b8ff-eba8-4972-9685-29b406fec743', '0ba1249e-e3b6-4d64-aac6-244ccaa4b344', 'Lọ', 1, true, 37500, 40000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('58636110-7a07-48e7-a30b-eb37997baf60', '0ba1249e-e3b6-4d64-aac6-244ccaa4b344', '25004CT', '2027-08-27', 3, 37500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('2e55a1af-a3f5-4af1-b0ed-29911f893122', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP187823', NULL, 'Estrolife', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('86bebbf3-d4e8-4aa4-b099-45079de07c71', '2e55a1af-a3f5-4af1-b0ed-29911f893122', 'Viên', 1, true, 3000, 5000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('501d69f3-30ff-4969-9235-2711076831f0', '2e55a1af-a3f5-4af1-b0ed-29911f893122', '24-1001', '2027-01-21', 50, 3000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('15a47f1c-07c6-4670-b2b0-464fb8275b17', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP187822', '8936224540102', 'Sano D3K2', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('edb214cc-4f1a-4da5-862b-c0f466b3992e', '15a47f1c-07c6-4670-b2b0-464fb8275b17', 'Lọ', 1, true, 110000, 150000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('0ca9fae9-bd43-407c-b9e7-be22bdc083c8', '15a47f1c-07c6-4670-b2b0-464fb8275b17', '0125', '2028-04-12', 6, 110000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('cc897416-0086-42a7-b1dd-c4021fb00ac0', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP187821', '8938538811763', 'Sâm Nhung Bổ Thận', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('d18cdaf3-03d9-46a5-9d88-9ed0664bdee2', 'cc897416-0086-42a7-b1dd-c4021fb00ac0', 'Lọ', 1, true, 53703, 120000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('a2459846-70d0-4b13-9041-004e8cbab942', 'cc897416-0086-42a7-b1dd-c4021fb00ac0', '011025', '2028-10-07', 32, 53703);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('af4d7f5e-86db-4229-b5cf-2ef0385cc7f5', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', '8938538811534', '8938538811534', 'Zin C', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('b546e0b4-9c89-469d-bd7d-b8a274b059ca', 'af4d7f5e-86db-4229-b5cf-2ef0385cc7f5', 'Viên', 1, true, 370, 700);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('96381504-9b16-4846-bb6b-470e370e761d', 'af4d7f5e-86db-4229-b5cf-2ef0385cc7f5', '020925', '2028-09-26', 0, 370);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('ecf8a978-ff01-4839-b52f-d1d7977cded0', 'af4d7f5e-86db-4229-b5cf-2ef0385cc7f5', '021225', '2029-12-01', 1960, 370);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('7b48d9a8-3418-49b5-a9ef-bf506db281f8', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP187820', NULL, 'Bcs Sarazu', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('a38720a3-df9d-40da-a3a5-b992f5385ec1', '7b48d9a8-3418-49b5-a9ef-bf506db281f8', 'Cái', 1, true, 0, 0);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('d74c4bd2-ea87-4288-879a-277fcfa9eed0', '7b48d9a8-3418-49b5-a9ef-bf506db281f8', '240601', '2031-05-29', 18, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('6e40d412-8066-4dc6-ab22-3cc5d5f5496a', 'cdae30e0-9366-4a54-b2b0-4dc3776f8fe5', 'SP084843', NULL, 'Tazret 0.05%', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('ed364032-b924-49d9-985f-b89ffe97aa1e', '6e40d412-8066-4dc6-ab22-3cc5d5f5496a', 'Tuýp', 1, true, 170000, 0);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('5b7aeb52-0516-4cf7-88af-f9e04343718b', '6e40d412-8066-4dc6-ab22-3cc5d5f5496a', '0', '2027-06-01', 0, 170000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('f58c64c8-35d6-4f6f-a594-6f19e7e8fed7', '6e40d412-8066-4dc6-ab22-3cc5d5f5496a', '0', '2028-01-01', 1, 170000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('41858531-9acb-4fbc-8718-b77717bb0235', '6afa32c5-1630-49f2-9d0f-06168b96b389', 'SP084842', '936064218452', 'Dầu Thất Sơn Trắng', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('0e2b4154-cab0-4c0d-8982-e6184a0d8e00', '41858531-9acb-4fbc-8718-b77717bb0235', 'Chai', 1, true, 26600, 30000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('39a422c1-f6db-4860-a51b-36aa747e963b', '41858531-9acb-4fbc-8718-b77717bb0235', '010124', '2029-01-15', 1, 26600);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('a2e3d672-b47a-4e99-b052-b03c1289fd2b', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP084838', '8936139773282', 'Sữa Ngũ Cốc', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('3125f364-74a2-45d3-83c4-f5852b22e3db', 'a2e3d672-b47a-4e99-b052-b03c1289fd2b', 'Lon', 1, true, 400000, 500000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('d7f0a1f2-65b5-4395-8961-90eb4b630de5', 'a2e3d672-b47a-4e99-b052-b03c1289fd2b', '151124', '2026-11-15', 2, 400000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('966104c5-855b-4bf5-bee2-ccae3f577734', 'a2e3d672-b47a-4e99-b052-b03c1289fd2b', '020425', '2027-04-02', 1, 400000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('4d937f28-b687-4eb5-a619-59a8136c1b72', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP084827', '8938530637125', 'Thiên môn bổ phổi thủy mẫu', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('539da262-5d02-4ef3-b667-f8eda0b619d4', '4d937f28-b687-4eb5-a619-59a8136c1b72', 'Chai', 1, true, 63500, 76000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('39faa837-38bc-4eab-bc93-83214384d11d', '4d937f28-b687-4eb5-a619-59a8136c1b72', '022025', '2028-09-14', 0, 63500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('d03973c1-514b-4654-a16b-2c5464506a21', '4d937f28-b687-4eb5-a619-59a8136c1b72', '032025', '2028-10-22', 5, 63500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('0409487f-372a-4e26-93e0-1dcc4692b550', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP084816', '8938554087982', 'Men Vi Sinh ProB', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('6134ded1-5505-4d9c-92b9-6a870fcb241d', '0409487f-372a-4e26-93e0-1dcc4692b550', 'Ống', 1, true, 4000, 6000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('b59a18c2-2a33-4985-b244-7e3fd6572616', '0409487f-372a-4e26-93e0-1dcc4692b550', '011225', '2027-12-05', 0, 4000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('fc61e9f6-4d96-4f99-a16a-1593306fcc5d', '0409487f-372a-4e26-93e0-1dcc4692b550', '030226', '2028-02-17', 94, 4000);
INSERT INTO public.products (id, category_id, product_code, name, is_active, is_direct_sale) 
                        VALUES ('9e952bb5-672f-4d27-852c-d35301f45023', '1fdb2de8-78f6-45ef-82db-35677936ff2c', 'PARENT_STREPSILS', 'Strepsils', true, false);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('bdfe6386-3af7-4784-970b-2d07d7909030', '1fdb2de8-78f6-45ef-82db-35677936ff2c', '9556108211332', NULL, 'Strepsils Honey And Lemon', true, '9e952bb5-672f-4d27-852c-d35301f45023', 'Honey And Lemon');
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('0e01f4f4-7fbd-46ee-8e28-1ff1b56dd11e', 'bdfe6386-3af7-4784-970b-2d07d7909030', 'Viên', 1, true, 1400, 1700);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('ea8e7d6d-6869-4443-a3be-72f5873d63e4', 'bdfe6386-3af7-4784-970b-2d07d7909030', 'ABH0706', '2028-08-11', 36, 1400);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('cbadacb6-6195-48e4-8bac-86fee7d71efc', 'bdfe6386-3af7-4784-970b-2d07d7909030', 'ABH7772', '2029-01-05', 120, 1400);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('6e1c79b2-0ee6-439d-b8b7-22bcd6cec151', '6afa32c5-1630-49f2-9d0f-06168b96b389', 'SP084814', '8888951888784', 'Dầu Gió xanh Eagle ( Chai Nhỏ )', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('e0b1babf-18c6-42db-8e62-fd693a4e89ae', '6e1c79b2-0ee6-439d-b8b7-22bcd6cec151', 'Chai', 1, true, 42500, 50000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('f9f3e7c1-91be-4de6-87e9-6b2c877c8486', '6e1c79b2-0ee6-439d-b8b7-22bcd6cec151', '825060', '2030-08-14', 1, 42500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('160d4e0a-f5c5-41e4-b0c6-cd983d44dd95', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP084809', '8938535625417', 'Skiperfect', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('2a115723-d3f4-40b4-83f8-b53e136c3809', '160d4e0a-f5c5-41e4-b0c6-cd983d44dd95', 'Viên', 1, true, 1685, 4000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('24330dd3-8878-471c-b531-5694c048a7ff', '160d4e0a-f5c5-41e4-b0c6-cd983d44dd95', '5001', '2028-10-30', 0, 1685);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('9d95e74e-40fa-4320-8380-b4f1d25dbeb6', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', '8936206260035', '8936206260035', 'Viên Sủi Vitrum', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('76f34927-0357-48a7-971a-9cd5d34abe2f', '9d95e74e-40fa-4320-8380-b4f1d25dbeb6', 'Viên', 1, true, 3500, 6000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('92da33b9-6989-4b88-84f2-2262645a2bcc', '9d95e74e-40fa-4320-8380-b4f1d25dbeb6', '011125', '2028-11-19', 62, 3500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('bacc3d15-24cc-4b95-bcad-77ea8ce3ca22', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP084807', '8936193782268', 'Pooh kids- Ăn Ngon Ngủ Ngon', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('bce8ed07-d46a-4f54-84ea-4e43896db502', 'bacc3d15-24cc-4b95-bcad-77ea8ce3ca22', 'Ống', 1, true, 5950, 7500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('dc7b52c0-3789-4233-ac80-913f44b7b908', 'bacc3d15-24cc-4b95-bcad-77ea8ce3ca22', '010925', '2028-09-03', 27, 5950);
INSERT INTO public.products (id, category_id, product_code, name, is_active, is_direct_sale) 
                        VALUES ('4f0897b5-b56e-41ca-9046-9d20dbdf6988', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'PARENT_PANADOL', 'Panadol', true, false);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('7d591bbf-f873-4454-8ac7-31e8e0867054', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP084804', NULL, 'Panadol viên sủi', true, '4f0897b5-b56e-41ca-9046-9d20dbdf6988', 'viên sủi');
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('58b2a10e-3076-4005-a504-7a0aeb082c27', '7d591bbf-f873-4454-8ac7-31e8e0867054', 'viên', 1, true, 2875, 4000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('4e6cc5a5-1aa4-47af-ac80-2371f497a830', '7d591bbf-f873-4454-8ac7-31e8e0867054', 'EB3A', '2028-06-14', 55, 2875);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('5230a3eb-e407-44a0-962f-b44396f981bd', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001924', NULL, 'Chích Thuốc Cảm', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('5b7debb2-eba4-4783-93c1-7bb55d1b5f3f', '5230a3eb-e407-44a0-962f-b44396f981bd', 'Mũi', 1, true, 20667.4, 100000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('a00bb06f-d950-4625-af6a-b7db7105779c', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001923', NULL, 'Soli Medon 40', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('3c82b2b8-9c98-4765-9853-5fe7c0d783e8', 'a00bb06f-d950-4625-af6a-b7db7105779c', 'Hộp', 1, true, 20000, 40000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                VALUES ('0d1c634f-b133-443e-b50d-86f8fc8b6457', 'a00bb06f-d950-4625-af6a-b7db7105779c', 'LO-MACDINH', '2099-12-31', 7, 20000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('c3b7ab6a-da02-4c7b-8c6a-9b0f487ca25b', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001920', NULL, 'Moriamin Forte', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('d1830d27-a6e9-4123-a3de-bdfc09e12419', 'c3b7ab6a-da02-4c7b-8c6a-9b0f487ca25b', 'Viên', 1, true, 3050, 3500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('99af31e7-0c7d-4155-9a1c-456f2e0ef255', 'c3b7ab6a-da02-4c7b-8c6a-9b0f487ca25b', '240726', '2027-04-08', 0, 3050);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('7cf60120-0292-47b1-a038-3063a9c6dbdf', 'c3b7ab6a-da02-4c7b-8c6a-9b0f487ca25b', '240902', '2027-06-17', 220, 3050);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('c45a53a2-00d4-4fad-b633-20e210be8dcc', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001917', NULL, 'Orlistat RVN 120', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('bd566531-0503-43d3-8c7d-463c3498a245', 'c45a53a2-00d4-4fad-b633-20e210be8dcc', 'viên', 1, true, 5600, 8500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('294eec2e-6470-48a5-9f25-8067ce99a637', 'c45a53a2-00d4-4fad-b633-20e210be8dcc', '0021224', '2027-12-10', 150, 5600);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('15a518c6-db4f-44e1-96f0-fbd9520d8d65', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP001914', NULL, 'Men vi sinh bioxclausi hataphar. hộp 20 ống x 5ml.', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('73346587-6b4a-4f15-b485-bf56f223e911', '15a518c6-db4f-44e1-96f0-fbd9520d8d65', 'Ống', 1, true, 0, 6000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                VALUES ('a0df56ea-5847-4ed1-bd00-fa6e07d5f971', '15a518c6-db4f-44e1-96f0-fbd9520d8d65', 'LO-MACDINH', '2099-12-31', 17, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('b125e483-ed1a-4310-a91f-7bd9eb592803', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP001912', NULL, 'Khẩu trang 3 mask', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('46af9b73-0e7f-4726-a617-2524277d9a92', 'b125e483-ed1a-4310-a91f-7bd9eb592803', 'Gói', 1, true, 7000, 10000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                VALUES ('86f7a1c5-7442-4c33-b809-30632428877f', 'b125e483-ed1a-4310-a91f-7bd9eb592803', 'LO-MACDINH', '2099-12-31', 6, 7000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('e5b43029-0800-4fc3-bcac-753e80232823', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001909', NULL, 'Zabales 75mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('21aa4fdc-a780-4e1d-a259-a6f18357f10c', 'e5b43029-0800-4fc3-bcac-753e80232823', 'Viên', 1, true, 1160, 2000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('cb944062-3ed8-4ce1-be01-51a2228ad5e3', 'e5b43029-0800-4fc3-bcac-753e80232823', '243450', '2027-11-29', 190, 1160);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('5cd9afb3-1058-49a2-a936-4f6ee33837ce', 'e5b43029-0800-4fc3-bcac-753e80232823', '0', '2028-01-01', 0, 1160);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('f9b0df2f-a6ad-47da-a16b-5f57414ea4f4', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP001905', NULL, 'Gan Cà Gai Leo 100k', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('929463d2-7bcb-4fc8-be2a-cd8220c20568', 'f9b0df2f-a6ad-47da-a16b-5f57414ea4f4', 'Viên', 1, true, 1200, 2000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('e68cebcf-70f9-4270-8939-65ddc5744793', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001900', '8936014583548', 'Tatanol Children', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('b9ed00d0-4122-48ee-816f-f4b77429c941', 'e68cebcf-70f9-4270-8939-65ddc5744793', 'Viên', 1, true, 329, 500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('913113c9-fd6b-424c-8a0e-b4a077bb4559', 'e68cebcf-70f9-4270-8939-65ddc5744793', '0', '2027-02-26', 820, 329);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('cea3060e-b02c-450f-bb4c-f49e146b3076', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001895', NULL, 'Kaflovo 500mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('2672f338-8fe3-40ac-a50e-4749b3961615', 'cea3060e-b02c-450f-bb4c-f49e146b3076', 'Viên', 1, true, 1542, 3000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('2306203c-280d-4957-be01-820aaee4fad7', 'cea3060e-b02c-450f-bb4c-f49e146b3076', '0', '2027-01-01', 274, 1542);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('94652998-e7da-443a-b331-d1e6f591d451', 'cea3060e-b02c-450f-bb4c-f49e146b3076', '9801125', '2028-12-25', 0, 1542);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('663249a9-19c7-453d-b60e-088f16fa840d', '6afa32c5-1630-49f2-9d0f-06168b96b389', 'SP001888', NULL, 'Dầu Lăn Xoa Bóp', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('89fee2f5-9a06-40a4-9a0b-88e6c2549c7b', '663249a9-19c7-453d-b60e-088f16fa840d', 'chai', 1, true, 80000, 100000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                VALUES ('a2b7bc3a-b0c2-4d97-9339-4e078e8e3c9b', '663249a9-19c7-453d-b60e-088f16fa840d', 'LO-MACDINH', '2099-12-31', 4, 80000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('48015b93-7a82-4431-954b-84e8f11c6df2', 'cdae30e0-9366-4a54-b2b0-4dc3776f8fe5', 'SP001886', NULL, 'Deriva MS 0.1', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('ecbfca22-1b5f-43cb-9a6a-17a281380bdb', '48015b93-7a82-4431-954b-84e8f11c6df2', 'Tuýp', 1, true, 140000, 0);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                VALUES ('8a881465-d768-4173-bf7e-3ad1379d1e23', '48015b93-7a82-4431-954b-84e8f11c6df2', 'LO-MACDINH', '2099-12-31', 21, 140000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('4f0ffcf4-3844-4179-a36b-a17db19cc33c', 'cdae30e0-9366-4a54-b2b0-4dc3776f8fe5', 'SP001884', NULL, 'Aldocont C', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('0fe6b4ea-ca3d-4579-9dea-08887ceb8169', '4f0ffcf4-3844-4179-a36b-a17db19cc33c', 'Tuýp', 1, true, 65000, 0);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                VALUES ('a3d3baab-e4bc-4be4-9bc6-17155250ddb5', '4f0ffcf4-3844-4179-a36b-a17db19cc33c', 'LO-MACDINH', '2099-12-31', 22, 65000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d4f110a3-3f64-4696-8730-0ea7645031fb', 'cdae30e0-9366-4a54-b2b0-4dc3776f8fe5', 'SP001883', NULL, 'Melacare Acne', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('66bd2a9e-07d2-4d57-b195-cdd382dced20', 'd4f110a3-3f64-4696-8730-0ea7645031fb', 'Tuýp', 1, true, 0, 0);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                VALUES ('7d2aac29-5eb8-4763-b25c-66fe0d0ff2e7', 'd4f110a3-3f64-4696-8730-0ea7645031fb', 'LO-MACDINH', '2099-12-31', 12, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('29091bb3-3330-4ed3-aaf9-8796b6fc7857', 'cdae30e0-9366-4a54-b2b0-4dc3776f8fe5', 'SP001882', NULL, 'Deriva CMS', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('ba817c66-6cdc-44bd-96ee-856b1277c97d', '29091bb3-3330-4ed3-aaf9-8796b6fc7857', 'Tuýp', 1, true, 160000, 0);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                VALUES ('27dc1a1f-dd59-482f-a1c7-a270f73ce74d', '29091bb3-3330-4ed3-aaf9-8796b6fc7857', 'LO-MACDINH', '2099-12-31', 25, 160000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('5f291870-16ec-4b84-af75-c05895e0b546', 'cdae30e0-9366-4a54-b2b0-4dc3776f8fe5', 'SP001881', NULL, 'Deriva Bpo', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('5d60e07b-7f63-4fe1-974a-5ac975129a2b', '5f291870-16ec-4b84-af75-c05895e0b546', 'Tuýp', 1, true, 170000, 0);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                VALUES ('f263923d-cb9e-440b-a9c9-3bf40d2892a1', '5f291870-16ec-4b84-af75-c05895e0b546', 'LO-MACDINH', '2099-12-31', 20, 170000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('b1756705-f394-47a9-b1c7-74ce100acd1e', 'cdae30e0-9366-4a54-b2b0-4dc3776f8fe5', 'SP001880', NULL, 'Erythego', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('fb2669f7-636b-4d3b-9013-fc4db0313a34', 'b1756705-f394-47a9-b1c7-74ce100acd1e', 'tuýp', 1, true, 140000, 0);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                VALUES ('e6d82aad-4e04-44ec-91af-054b3eaec376', 'b1756705-f394-47a9-b1c7-74ce100acd1e', 'LO-MACDINH', '2099-12-31', 4, 140000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('592b36b0-e362-4fc7-9cbe-83631c0bbb85', '6afa32c5-1630-49f2-9d0f-06168b96b389', 'SP001868', NULL, 'Bostoral', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('bd891173-0df4-4831-8b57-3992ee3eb149', '592b36b0-e362-4fc7-9cbe-83631c0bbb85', 'Tuýp', 1, true, 18000, 25000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('6115eb5b-240b-4c7a-bbff-03a2ea602991', '592b36b0-e362-4fc7-9cbe-83631c0bbb85', '0', '2028-07-19', 0, 18000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('77491509-7e58-4a35-878e-812ae6b83bba', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001861', '8936064214195', 'Olangim 10mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('c8a92322-f179-4fe5-8a41-cd408830c776', '77491509-7e58-4a35-878e-812ae6b83bba', 'Viên', 1, true, 700, 1000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('cdb71340-905e-4a4c-9dfe-16009e90354a', '77491509-7e58-4a35-878e-812ae6b83bba', '0', '2028-02-26', 140, 700);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('14f369f9-bd12-40ca-8edb-a715103f1a98', 'cdae30e0-9366-4a54-b2b0-4dc3776f8fe5', '8938531751257', '8938531751257', 'Skinamex 100g', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('36911e8e-4631-4d67-b743-f0dbd62f465c', '14f369f9-bd12-40ca-8edb-a715103f1a98', 'Chai', 1, true, 0, 150000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                VALUES ('1d0137ad-5f74-4ae0-8752-3b72f7a6552b', '14f369f9-bd12-40ca-8edb-a715103f1a98', 'LO-MACDINH', '2099-12-31', 2, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('f9664964-1439-4f68-9e56-77781c5cc7a3', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP001859', NULL, 'Nước muối Chai lớn', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('2f250b1b-0af8-41c2-b426-61f0215a54cc', 'f9664964-1439-4f68-9e56-77781c5cc7a3', 'Chai', 1, true, 10000, 15000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                VALUES ('d79c21a4-3b03-4c96-866b-36cb5abdb33e', 'f9664964-1439-4f68-9e56-77781c5cc7a3', 'LO-MACDINH', '2099-12-31', 27, 10000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('2edb88c2-0b19-4b93-bee0-732f44920e6b', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP001858', NULL, 'Nước muối chai nhỏ', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('9608c20e-5301-4116-a47d-dc4408786d88', '2edb88c2-0b19-4b93-bee0-732f44920e6b', 'Chai', 1, true, 6700, 10000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                VALUES ('c9b48a3e-32ce-4193-8cd3-70a365f370b4', '2edb88c2-0b19-4b93-bee0-732f44920e6b', 'LO-MACDINH', '2099-12-31', 44, 6700);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('5cfa0b7b-5e94-4995-a085-f4868213c88b', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001856', '8934690101438', 'Biragan 300', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('740a9acd-b596-4472-afd8-36bfd7197b83', '5cfa0b7b-5e94-4995-a085-f4868213c88b', 'Viên', 1, true, 2000, 3000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('ed3de780-670b-4334-b0c3-07f0610325d8', '5cfa0b7b-5e94-4995-a085-f4868213c88b', '0', '2025-12-31', 0, 2000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('6654cfba-ba8d-40cd-bb00-edae58e99f87', '5cfa0b7b-5e94-4995-a085-f4868213c88b', '24001', '2027-12-25', 70, 2000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('0deabaab-c53e-4c5c-b145-14db513b7a93', '5cfa0b7b-5e94-4995-a085-f4868213c88b', '25001', '2028-12-19', 30, 2000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('26ad9f0d-7971-4a71-be74-8dd405e3e343', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001854', '8934690101292', 'Biragan 150', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('53e8fcae-bda4-47ec-9f92-7d8afd45a9cc', '26ad9f0d-7971-4a71-be74-8dd405e3e343', 'Viên', 1, true, 2300, 2600);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('9962017a-e015-4729-ad0e-4dfcf7100b43', '26ad9f0d-7971-4a71-be74-8dd405e3e343', '0', '2026-01-01', 0, 2300);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('51fee503-d74a-4273-88f9-cf8c97dee883', '26ad9f0d-7971-4a71-be74-8dd405e3e343', '24003', '2027-12-08', 0, 2300);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('4706f86b-077d-41fa-bd67-d04e472fef43', '26ad9f0d-7971-4a71-be74-8dd405e3e343', '25002', '2028-09-26', 90, 2300);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('fa5649e9-5b5f-442f-a81c-a78c46b5b177', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001851', '8936098965094', 'Zensalbu nebules 5.0', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('68036a29-7b26-4b2e-9de2-be7365ebb37b', 'fa5649e9-5b5f-442f-a81c-a78c46b5b177', 'Ống', 1, true, 7000, 9000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('dd6765e6-b0e9-41cd-be96-07e3e9c37108', 'fa5649e9-5b5f-442f-a81c-a78c46b5b177', '0', '2028-08-29', 0, 7000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('2e0f6bfa-507d-4d11-a0e7-1a74a072b96f', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001846', '8936061373161', 'Mibeserc 24', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('ac08d8d6-b402-4f30-a8cc-5219bcc9e1af', '2e0f6bfa-507d-4d11-a0e7-1a74a072b96f', 'Viên', 1, true, 2000, 4000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('e4776eda-70df-42d4-9ec2-2379b762af22', '2e0f6bfa-507d-4d11-a0e7-1a74a072b96f', '0', '2028-06-24', 297, 2000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('382996b6-76ad-4a5e-bdfb-ce5587a117c2', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001844', '8935206094916', 'Hapacol 250', true, 'adf3126f-fbe7-4be2-b87a-d0b41fe2bc64', '250');
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('4fffefb0-85b6-4a8f-934f-d2cc65194511', '382996b6-76ad-4a5e-bdfb-ce5587a117c2', 'Gói', 1, true, 1920, 2500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('4d0f0d53-b6b3-40ea-929f-a432697a9757', '382996b6-76ad-4a5e-bdfb-ce5587a117c2', '0', '2026-01-01', 0, 1920);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('720abce9-5e31-4a75-a6dd-93f0743eaf04', '382996b6-76ad-4a5e-bdfb-ce5587a117c2', '160625', '2028-06-16', 0, 1920);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('7cf1919c-95a9-4654-a1a0-42a9806ae4a1', '382996b6-76ad-4a5e-bdfb-ce5587a117c2', '211125', '2028-11-24', 286, 1920);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('53d76d12-74d0-4b61-a52e-505932e5002e', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001837', NULL, 'Gabapentin 300', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('67923b7d-8961-40de-aac9-c9a344ece163', '53d76d12-74d0-4b61-a52e-505932e5002e', 'Viên', 1, true, 850, 1500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('3151f128-837a-4df8-abe2-015dce62b3ec', '53d76d12-74d0-4b61-a52e-505932e5002e', '0', '2027-01-01', 0, 850);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('73e7ca54-fd36-4657-b033-19e647b2ca73', '53d76d12-74d0-4b61-a52e-505932e5002e', '031125', '2028-12-01', 275, 850);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('01310318-dfc8-4bb7-8851-ca3ffa0b2ad2', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001834', '8002660025371', 'Betaserc 24mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('5e9c992e-ab93-4b21-8aad-b9b2bae2d944', '01310318-dfc8-4bb7-8851-ca3ffa0b2ad2', 'Viên', 1, true, 6500, 7000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('a1b79836-cc08-4662-b3e5-b3caa8367ce5', '01310318-dfc8-4bb7-8851-ca3ffa0b2ad2', '0', '2027-12-01', 30, 6500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('525e6b29-136d-4ed1-bcc3-a570ae4db6d6', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001824', '8935146200415', 'Cefuroxim 500mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('a189f2d0-f50f-477f-91cc-538b0a21f473', '525e6b29-136d-4ed1-bcc3-a570ae4db6d6', 'Viên', 1, true, 3050, 4000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('9ce50eef-58e1-458f-af75-c3e18fc797d8', '525e6b29-136d-4ed1-bcc3-a570ae4db6d6', '0', '2028-07-09', 1, 3050);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('8ecc2209-bf15-44db-b037-56faba7dba19', '525e6b29-136d-4ed1-bcc3-a570ae4db6d6', '2190426', '2029-04-10', 100, 3050);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('ba3b81b5-098a-4565-b002-02ec9fae3869', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001822', '8934690001042', 'Bifacold 200mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('7901eb6b-feb9-4251-b797-21dd9d102b7a', 'ba3b81b5-098a-4565-b002-02ec9fae3869', 'Gói', 1, true, 1300, 2000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('1cb96b71-c651-4ad1-9bcb-a79f4dd54ace', 'ba3b81b5-098a-4565-b002-02ec9fae3869', '0', '2027-01-01', 0, 1300);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('ec6e0234-a968-4325-abf6-9bb8575cf313', 'ba3b81b5-098a-4565-b002-02ec9fae3869', '26001', '2029-01-06', 800, 1300);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('bf2860e7-b608-45ed-a33e-b8126fa02ba2', 'cdae30e0-9366-4a54-b2b0-4dc3776f8fe5', 'SP001820', NULL, 'Dầu Gội Sano Hair', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('e2f82e17-38cf-426f-ba73-88d48d260ae4', 'bf2860e7-b608-45ed-a33e-b8126fa02ba2', 'Gói', 1, true, 4500, 6000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                VALUES ('8f961f9c-7878-4d39-bcf2-340e51c4c2f2', 'bf2860e7-b608-45ed-a33e-b8126fa02ba2', 'LO-MACDINH', '2099-12-31', 288, 4500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('76997f6b-0677-4d7b-b159-f639d97108fb', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP001818', NULL, 'Khẩu Trang', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('fb87b0ea-dff2-40ff-8adf-655059a81f03', '76997f6b-0677-4d7b-b159-f639d97108fb', 'Gói', 1, true, 5000, 10000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                VALUES ('b40837de-8b1d-4556-bca0-c41caab5d316', '76997f6b-0677-4d7b-b159-f639d97108fb', 'LO-MACDINH', '2099-12-31', 244, 5000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('71a654e6-a565-45e0-96cc-799ba4676c37', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP001816', NULL, 'Calci Nano plus', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('a153ca0c-cf22-4c01-9b2f-1fc6f110a0b6', '71a654e6-a565-45e0-96cc-799ba4676c37', 'Ống', 1, true, 5500, 7500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                VALUES ('38231c56-da97-465c-87d3-041f27040fa1', '71a654e6-a565-45e0-96cc-799ba4676c37', 'LO-MACDINH', '2099-12-31', 45, 5500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('e6b43e6d-d50d-4eff-9a0e-00ca86de2b63', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP001815', NULL, 'Khẩu trang Famapro', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('077a53a7-cde4-40e4-8535-81b32f9d47e1', 'e6b43e6d-d50d-4eff-9a0e-00ca86de2b63', 'Hộp', 1, true, 8000, 10000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                VALUES ('c0831e3d-d909-4b26-ac08-38a779d6823c', 'e6b43e6d-d50d-4eff-9a0e-00ca86de2b63', 'LO-MACDINH', '2099-12-31', 2, 8000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('bf3641db-dc9b-4611-95a9-57c6489af7f9', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001812', '8935206094992', 'Hapacol 150', true, 'adf3126f-fbe7-4be2-b87a-d0b41fe2bc64', '150');
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('2f8aeadd-fa9c-4c9b-9747-9f62051d6290', 'bf3641db-dc9b-4611-95a9-57c6489af7f9', 'Gói', 1, true, 1675, 2000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('afa9e6d5-d3d2-4461-b29b-de46b041dbe3', 'bf3641db-dc9b-4611-95a9-57c6489af7f9', '0', '2027-11-02', 0, 1675);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('74d513e0-aa1b-44fd-a843-f879136697a9', 'bf3641db-dc9b-4611-95a9-57c6489af7f9', '171225', '2028-12-12', 179, 1675);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('0144979d-efcb-4854-b7e3-3bc99ef3f541', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001809', NULL, 'Panactol Enfant', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('6c2e74d6-dde9-4cd5-be52-6db37fcdfbfc', '0144979d-efcb-4854-b7e3-3bc99ef3f541', 'Viên', 1, true, 350, 500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('1ecfff1e-09e9-4ac2-8703-caded83639b5', '0144979d-efcb-4854-b7e3-3bc99ef3f541', '0', '2026-12-19', 492, 350);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('812d1e75-5520-41d5-9e47-493ba27264ab', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP001805', NULL, 'Gan 10k vỉ', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('117b5077-aae0-4431-93aa-114312f82087', '812d1e75-5520-41d5-9e47-493ba27264ab', 'Viên', 1, true, 960, 1000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                VALUES ('8f249c67-4b8c-4fa9-8e74-764dc62e434c', '812d1e75-5520-41d5-9e47-493ba27264ab', 'LO-MACDINH', '2099-12-31', 2880, 960);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('9065c1a5-a13b-4c4c-bcde-37f612c54b8b', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', '8935127577772', '8935127577772', 'Tobicom', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('91f133a7-5712-42c7-b610-5c98508cbff6', '9065c1a5-a13b-4c4c-bcde-37f612c54b8b', 'Viên', 1, true, 1600, 2000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                VALUES ('29fabcb2-ec14-454e-a12f-ad35b3b378b5', '9065c1a5-a13b-4c4c-bcde-37f612c54b8b', 'LO-MACDINH', '2099-12-31', 630, 1600);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('2170c592-7edd-4b99-8707-59911c3320cb', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP001792', NULL, 'Cồn 90 (chai nhỏ)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('1840b3aa-aaa6-4960-85d3-8c6b4f06592a', '2170c592-7edd-4b99-8707-59911c3320cb', 'Chai', 1, true, 3540, 5000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                VALUES ('e8e75778-4045-497e-a8a0-e24ad929770a', '2170c592-7edd-4b99-8707-59911c3320cb', 'LO-MACDINH', '2099-12-31', 95, 3540);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('2f520088-0269-4ef3-82b0-5ee8be500ae9', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP001791', NULL, 'Cồn 90 (chai lớn)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('4e45cfb8-4dcf-4b22-a20c-9d62b77ecc35', '2f520088-0269-4ef3-82b0-5ee8be500ae9', 'Chai', 1, true, 42000, 50000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                VALUES ('a54710d0-3c5d-4703-844e-35d027398e90', '2f520088-0269-4ef3-82b0-5ee8be500ae9', 'LO-MACDINH', '2099-12-31', 2, 42000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('fb5b7a99-579a-4e22-ae29-3b1cff33fb3a', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP001790', NULL, 'Cồn 90 (Chai Lớn Vòi )', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('aa7c5aed-c28d-44b6-8ccd-4f38c838ca04', 'fb5b7a99-579a-4e22-ae29-3b1cff33fb3a', 'Chai', 1, true, 48000, 60000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                VALUES ('744784cb-6885-4a95-8acb-619dd9cd4071', 'fb5b7a99-579a-4e22-ae29-3b1cff33fb3a', 'LO-MACDINH', '2099-12-31', 6, 48000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('afd96170-3696-4f2a-859a-ea4eaef5d128', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP001789', NULL, 'Cồn 70 (Chai Lớn )', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('0e4cf6cb-bd72-4639-bfac-1ff7e730848a', 'afd96170-3696-4f2a-859a-ea4eaef5d128', 'Chai', 1, true, 42400, 50000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                VALUES ('3eb2b0a4-8edf-45fd-96dd-4877d1acb89d', 'afd96170-3696-4f2a-859a-ea4eaef5d128', 'LO-MACDINH', '2099-12-31', 4, 42400);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('966931a3-f9fb-437d-9e54-b3c7bc70d25a', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP001784', NULL, 'Kẹo dẻo 10k', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('b6a9bb6d-5465-4000-8270-1d0f967ee2b4', '966931a3-f9fb-437d-9e54-b3c7bc70d25a', 'Gói', 1, true, 6940, 10000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                VALUES ('00b0d182-23d2-4b12-9d5b-970678a2af90', '966931a3-f9fb-437d-9e54-b3c7bc70d25a', 'LO-MACDINH', '2099-12-31', 37, 6940);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('a04741fa-4e9b-4abf-be8d-f8254ea08adc', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001780', '8934903000992', 'Desloratadin 2.5mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('b340dd76-6ed9-4c93-9219-baa9b13fc463', 'a04741fa-4e9b-4abf-be8d-f8254ea08adc', 'Gói', 1, true, 4800, 6000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('f953074a-2ca1-40ec-8261-5213a525c1d7', 'a04741fa-4e9b-4abf-be8d-f8254ea08adc', '0', '2028-02-25', 17, 4800);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('b808c245-0a6a-4fc5-9292-f28eb9fa853d', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001775', '8935146200347', 'Augxicine 1g', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('b000e51d-f72f-47e2-9d0d-c4481289911a', 'b808c245-0a6a-4fc5-9292-f28eb9fa853d', 'Viên', 1, true, 3180, 8000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('96fa0143-2692-4b49-868d-bcc25d93cbaa', 'b808c245-0a6a-4fc5-9292-f28eb9fa853d', '0', '2027-06-27', 106, 3180);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('7f2e34b5-9842-4f82-aa33-23efcac40520', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001770', '8935146200279', 'Augxicine 625', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('506c49a5-bd84-4272-a97c-e1d726cc1e8c', '7f2e34b5-9842-4f82-aa33-23efcac40520', 'Viên', 1, true, 2800, 6000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('37d8f4b6-35a5-418a-910d-02d7d88526e0', '7f2e34b5-9842-4f82-aa33-23efcac40520', '0', '2027-07-11', 0, 2800);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('b4d27c37-6e2a-41f3-b20a-9c8c812910ca', '7f2e34b5-9842-4f82-aa33-23efcac40520', '2291225', '2027-12-03', 44, 2800);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('f13dd718-e527-4d1b-9342-698303e11601', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001769', NULL, 'Chích viêm mũi dị ứng', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('f4a31d5b-ac23-4098-9f3a-ab07912e6867', 'f13dd718-e527-4d1b-9342-698303e11601', 'Viên', 1, true, 69231.4, 170000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('930627ac-ac4e-448e-b6d4-36eb34925da9', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP001766', NULL, 'Creatin boston', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('466ac5e1-e734-49b5-bac0-bb8aa8a6b4ec', '930627ac-ac4e-448e-b6d4-36eb34925da9', 'Viên', 1, true, 890, 1000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('57931413-11c7-466b-bfd8-68dc5834e0d1', '930627ac-ac4e-448e-b6d4-36eb34925da9', '0', '2028-04-02', 200, 890);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('023370c1-2bf6-426c-9170-390fca26db76', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP001763', NULL, 'Homiginmin Ginseng', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('d30550c8-d022-483a-931b-dbe275572fe8', '023370c1-2bf6-426c-9170-390fca26db76', 'Viên', 1, true, 600, 2000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('8a0c0707-2417-4609-a2ce-584a613eef32', '023370c1-2bf6-426c-9170-390fca26db76', '0', '2028-01-01', 1023, 600);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('2b3cc9dc-aef1-45a9-a555-898561a692e7', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001751', NULL, 'AT Bisoprolol 2.5mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('b36ee39b-1545-4023-b756-35ca20b6887d', '2b3cc9dc-aef1-45a9-a555-898561a692e7', 'Viên', 1, true, 300, 1000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('05e26da1-b0dd-431b-97e9-c87fb874739d', '2b3cc9dc-aef1-45a9-a555-898561a692e7', '0', '2027-05-08', 388, 300);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('723b1358-a821-404e-8208-10f553b969c6', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001748', NULL, 'Ho Xanh', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('012f592c-e916-4df4-a112-ab1073749988', '723b1358-a821-404e-8208-10f553b969c6', 'Viên', 1, true, 350, 500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('ceaad806-7082-4f5a-b61f-b6aedd392c49', '723b1358-a821-404e-8208-10f553b969c6', '0', '2027-01-01', 20290, 350);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('cb005e97-5a8e-4cb3-bae4-dffed3a5ee41', 'cdae30e0-9366-4a54-b2b0-4dc3776f8fe5', 'SP001738', NULL, 'Soffell', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('0aa230f7-f2fa-4306-b50a-3316ab80bd29', 'cb005e97-5a8e-4cb3-bae4-dffed3a5ee41', 'Chai', 1, true, 20000, 22000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                VALUES ('94ec79d2-e90d-4140-b6b7-7333f27d0b36', 'cb005e97-5a8e-4cb3-bae4-dffed3a5ee41', 'LO-MACDINH', '2099-12-31', 16, 20000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('4f1eda08-917c-4574-89c6-9702cf065319', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001732', '8936024391874', 'Spinolac 25mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('53ead7f1-8a09-4199-8575-f558638f8ad4', '4f1eda08-917c-4574-89c6-9702cf065319', 'Viên', 1, true, 1853, 2000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('0372dc09-6c58-4445-a185-e06face9def7', '4f1eda08-917c-4574-89c6-9702cf065319', '0', '2028-03-26', 356, 1853);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('379142f3-9046-42a1-9dc1-eb56a52df9e3', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001727', '8936064214959', 'ASPIRIN 81mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('255fc332-590b-4856-ba65-40e942ecaf8a', '379142f3-9046-42a1-9dc1-eb56a52df9e3', 'Viên', 1, true, 190, 500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('2ffec9fa-3f59-4747-b027-0195a501b203', '379142f3-9046-42a1-9dc1-eb56a52df9e3', '0', '2026-06-04', 0, 190);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('92007f68-a52c-4cc1-9cdc-c2d4a8a009c2', '379142f3-9046-42a1-9dc1-eb56a52df9e3', '0', '2027-05-14', 536, 190);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('7102cc75-a09b-4e91-8e05-1490ae18c3a4', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP001724', NULL, 'Sắt Viên', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('3563621f-222a-49f5-839f-c3908ef348a6', '7102cc75-a09b-4e91-8e05-1490ae18c3a4', 'Viên', 1, true, 500, 2000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('36ff74a3-21b0-4875-8ebb-c88dd50b6b7c', '7102cc75-a09b-4e91-8e05-1490ae18c3a4', '0', '2028-05-13', 40, 500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('35b156c9-e86f-498e-b1cf-d332a9bdfc51', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP001708', NULL, 'Vitamin AD', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('8b232ca8-464b-42e2-b501-fd47ac429466', '35b156c9-e86f-498e-b1cf-d332a9bdfc51', 'Viên', 1, true, 290, 500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('88d33dd6-f599-4cf0-b07e-2f392cbed464', '35b156c9-e86f-498e-b1cf-d332a9bdfc51', '0725', '2028-07-30', 0, 290);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('7d7218aa-5c15-4ab4-851c-4db8c6a6984a', '35b156c9-e86f-498e-b1cf-d332a9bdfc51', '090925', '2028-09-30', 420, 290);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('474709a1-1b72-41de-976d-c6afee861471', '1fdb2de8-78f6-45ef-82db-35677936ff2c', 'SP001695', NULL, 'Kẹo Ngậm Bảo Thanh', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('bed2a533-89f1-4ed4-b5bb-58230abb8025', '474709a1-1b72-41de-976d-c6afee861471', 'Gói', 1, true, 14000, 15000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('3a83593f-1b6d-4c20-a49a-934562b0640c', '474709a1-1b72-41de-976d-c6afee861471', '0', '2028-01-03', 0, 14000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('9bcafd02-a14f-417c-b141-559028f89ed6', '474709a1-1b72-41de-976d-c6afee861471', '0', '2028-04-23', 0, 14000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('2b0bee66-3911-4bcc-8c32-af281a34b8f2', '474709a1-1b72-41de-976d-c6afee861471', '10825', '2028-07-09', 0, 14000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('15e3461b-286c-4e36-85dd-dc4ac412a4e7', '474709a1-1b72-41de-976d-c6afee861471', '13225', '2028-08-28', 0, 14000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('e7fb14eb-9853-4ffb-aef8-a584d41a44b2', '474709a1-1b72-41de-976d-c6afee861471', '14125', '2028-09-09', 15, 14000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('f8bbdf8a-9981-48b0-b268-8e61cea75674', '474709a1-1b72-41de-976d-c6afee861471', '1326', '2029-01-24', 60, 14000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d0ddf46c-59c6-42a6-98f5-474923798318', '1fdb2de8-78f6-45ef-82db-35677936ff2c', 'SP001693', NULL, 'Kẹo Gừng', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('8a85d798-7030-43b9-a4c1-f332378dbf44', 'd0ddf46c-59c6-42a6-98f5-474923798318', 'Viên', 1, true, 400, 1000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                VALUES ('154aa251-f7b5-4fa9-b4c4-33dbfcf3b96a', 'd0ddf46c-59c6-42a6-98f5-474923798318', 'LO-MACDINH', '2099-12-31', 611, 400);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('16864a8e-5938-40b5-9656-5ff362de397f', '1fdb2de8-78f6-45ef-82db-35677936ff2c', 'SP001691', NULL, 'Kẹo Bạc Hà', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('1a9dbd52-213c-4f16-881a-fec8268656bb', '16864a8e-5938-40b5-9656-5ff362de397f', 'Viên', 1, true, 400, 1000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                VALUES ('c4f7cc0d-99b7-45a5-8537-f59410c6a19e', '16864a8e-5938-40b5-9656-5ff362de397f', 'LO-MACDINH', '2099-12-31', 1195, 400);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('b54766c8-dc4d-4d35-bb77-0f24f20ea135', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP001679', NULL, 'Siro Tỳ Bà Diệp', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('6cd0c362-354a-40b0-833d-67f9b4ea2358', 'b54766c8-dc4d-4d35-bb77-0f24f20ea135', 'Gói', 1, true, 1900, 3000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('61f550dd-75bd-4610-ac8c-6a42ea4bd8ba', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP001677', NULL, 'Thuốc liều 10k', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('8b82c98d-7bbc-41c6-a2cd-897a000c65ae', '61f550dd-75bd-4610-ac8c-6a42ea4bd8ba', 'Viên', 1, true, 6000, 10000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('db20a214-bad2-4f8f-89b6-a1c2f2fc0401', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP001674', NULL, 'Thử đường', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('0cbf8f50-94e2-4ca9-bf60-a8aa8f6ea700', 'db20a214-bad2-4f8f-89b6-a1c2f2fc0401', 'Viên', 1, true, 5000, 20000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('b0ed36ca-fd64-47fb-b831-dc950dffe484', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP001672', NULL, 'Que thử đường', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('337d3477-5df3-4c71-b3e2-f1ae61fe7984', 'b0ed36ca-fd64-47fb-b831-dc950dffe484', 'que', 1, true, 5000, 9000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                VALUES ('62686e1c-e582-4f1a-b9b5-420ed16a6176', 'b0ed36ca-fd64-47fb-b831-dc950dffe484', 'LO-MACDINH', '2099-12-31', 29, 5000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('f84f0240-35fb-4c44-88aa-434891b849a4', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP001669', NULL, 'Găng Tay Y Tế Vglove', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('431c4d8a-4368-4520-9587-4e4803bb6fbe', 'f84f0240-35fb-4c44-88aa-434891b849a4', 'cái', 1, true, 600, 1000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                VALUES ('062b4039-c724-4569-9150-4456c950cd05', 'f84f0240-35fb-4c44-88aa-434891b849a4', 'LO-MACDINH', '2099-12-31', 286, 600);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('034618c3-89cd-46e7-8640-119de9891857', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001667', NULL, 'Triamcinolone 80 mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('200aef6a-ca3f-4a48-84ed-5067231082f6', '034618c3-89cd-46e7-8640-119de9891857', 'Ống', 1, true, 68564, 80000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                VALUES ('39ed33c4-b60f-4493-a0cf-93eaad6fd08c', '034618c3-89cd-46e7-8640-119de9891857', 'LO-MACDINH', '2099-12-31', 27, 68564);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('8d9abef6-a80a-4eff-8e8f-469080245640', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP001657', '8938538811787', 'Hà Thủ Ô', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('9ccb908a-e9a1-4b2a-8081-f06cf30dde9d', '8d9abef6-a80a-4eff-8e8f-469080245640', 'Viên', 1, true, 3000, 5000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('a89da23f-6ba6-4f47-bae6-030876856efc', '8d9abef6-a80a-4eff-8e8f-469080245640', '021224', '2027-12-19', 480, 3000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('85da4dd2-781b-4d92-b7ee-7bd2e6c3cd0e', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001656', NULL, 'Chích co thắt đường ruột', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('6a474b2f-5bf4-4035-b2f5-425b302bdba9', '85da4dd2-781b-4d92-b7ee-7bd2e6c3cd0e', 'Viên', 1, true, 2487.4, 50000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('9b4249c1-c327-4419-b7aa-64cab0384358', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001654', NULL, 'Metoclopramid 10mg( Tiêm )', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('c9d871f4-831b-47c9-824b-dc7f288e23b4', '9b4249c1-c327-4419-b7aa-64cab0384358', 'ống', 1, true, 1820, 0);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                VALUES ('e10f0269-9bee-4cb2-9009-d7217ea260f2', '9b4249c1-c327-4419-b7aa-64cab0384358', 'LO-MACDINH', '2099-12-31', 9, 1820);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('3a1fa8c9-5325-4ff2-a08f-ad662d3314b9', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001653', NULL, 'Chích chóng mặt Diphenhydramin', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('c8e698f8-b8e8-47da-a0b0-15f931b49cef', '3a1fa8c9-5325-4ff2-a08f-ad662d3314b9', 'Viên', 1, true, 1366.4, 50000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('231710e5-c4e3-4e3f-bc48-2b119bfe10ea', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001651', NULL, 'Diphenhydramin 10mg (Tiêm )', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('90836f84-e978-4244-b1fb-8ac2d651292b', '231710e5-c4e3-4e3f-bc48-2b119bfe10ea', 'ống', 1, true, 699, 0);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                VALUES ('90d7498a-c10c-4db6-ade6-5f7c0f8738e3', '231710e5-c4e3-4e3f-bc48-2b119bfe10ea', 'LO-MACDINH', '2099-12-31', 69, 699);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('891be033-af98-4ec9-aac6-4a72fae76c70', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001650', NULL, 'Chích cảm Hydrocortisone', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('e3dbc92b-bd13-48b0-bcee-4f6cfdbfe2fb', '891be033-af98-4ec9-aac6-4a72fae76c70', 'Viên', 1, true, 20667.4, 100000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('0b78a694-4e9e-4cc3-8fa1-f8e06d159227', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001649', NULL, 'Hydrocortisone 100mg(Tiêm)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('cf932fc7-06d8-493d-899d-ec6fde7a8e96', '0b78a694-4e9e-4cc3-8fa1-f8e06d159227', 'Ống', 1, true, 20000, 0);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                VALUES ('61e5f35b-49fb-4887-88f7-a54540b86081', '0b78a694-4e9e-4cc3-8fa1-f8e06d159227', 'LO-MACDINH', '2099-12-31', 4, 20000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('2253c454-f3ea-407b-82ce-35d44e63d5bd', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001646', NULL, 'Chích đau nhứt diclofenac 75mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('6800e5cd-538d-4f84-8a34-7a0012c45f05', '2253c454-f3ea-407b-82ce-35d44e63d5bd', 'Viên', 1, true, 2963.4, 50000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('3ff09d42-4093-41f8-a266-502e2a3e6077', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001644', NULL, 'Diclofenac 75mg (Tiêm)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('f2e4ad5f-ef9b-46b7-b35a-e5007ffe981e', '3ff09d42-4093-41f8-a266-502e2a3e6077', 'Ống', 1, true, 2296, 0);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                VALUES ('04e5e176-9918-4ff4-b565-0c60be5e38ec', '3ff09d42-4093-41f8-a266-502e2a3e6077', 'LO-MACDINH', '2099-12-31', 114, 2296);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('c4a78e00-4bfd-43df-8fa3-38ac3a8dd2a3', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001643', NULL, 'Chích thuốc khoẻ', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('03227603-4086-4a96-9d60-4eb8f209a3ba', 'c4a78e00-4bfd-43df-8fa3-38ac3a8dd2a3', 'Viên', 1, true, 2392.4, 80000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('02b88a51-299e-4021-bd2a-f7b564e1ed30', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001641', '8936213363026', 'Supvizyn New', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('d4baa0ae-06b4-43f3-af28-af3f0996422b', '02b88a51-299e-4021-bd2a-f7b564e1ed30', 'ống', 1, true, 1725, 0);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                VALUES ('e60c350c-adcf-421d-be96-7ad00217e34e', '02b88a51-299e-4021-bd2a-f7b564e1ed30', 'LO-MACDINH', '2099-12-31', 86, 1725);
INSERT INTO public.products (id, category_id, product_code, name, is_active, is_direct_sale) 
                        VALUES ('8c1efe46-d774-4fda-87ed-9baf23350b20', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'PARENT_DECOLGEN', 'Decolgen', true, false);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('48349b9c-9364-4923-bcd2-676591d939bb', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001639', '8936022471905', 'Decolgen Forte', true, '8c1efe46-d774-4fda-87ed-9baf23350b20', 'Forte');
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('7a783384-6fbe-43ea-9f44-02094b59835a', '48349b9c-9364-4923-bcd2-676591d939bb', 'Viên', 1, true, 1195, 1500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('e8e41e51-835a-4f76-bfb8-7a355931bc03', '48349b9c-9364-4923-bcd2-676591d939bb', '503371', '2029-02-28', 128, 1195);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d7c250e7-39d7-41db-b26e-52ea980bcfe9', '6afa32c5-1630-49f2-9d0f-06168b96b389', 'SP001633', '8888951888722', 'Dầu Gió xanh Eagle Brand ( Chai Lớn )', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('f508556c-9d79-49cd-8f7d-e80ea8ec5481', 'd7c250e7-39d7-41db-b26e-52ea980bcfe9', 'chai', 1, true, 74180, 80000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                VALUES ('e1aa89f5-5356-45d8-9b60-f59417d9a3fd', 'd7c250e7-39d7-41db-b26e-52ea980bcfe9', 'LO-MACDINH', '2099-12-31', 5, 74180);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('7875394f-9f75-4d8a-92c8-d283eaadefa1', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001630', NULL, 'Rotundin 60mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('b808ab29-a269-413a-8305-b7aa53484a8c', '7875394f-9f75-4d8a-92c8-d283eaadefa1', 'Viên', 1, true, 1037, 1500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('d7d0dd02-00b8-4a2a-80d7-944e72ec6553', '7875394f-9f75-4d8a-92c8-d283eaadefa1', '4980225', '2028-02-13', 0, 1037);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('17157643-355c-4769-a0ec-7ba31f6edd6a', '7875394f-9f75-4d8a-92c8-d283eaadefa1', '790425', '2028-05-03', 223, 1037);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d0393333-d785-4acb-94cc-58092e8356f5', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001625', NULL, 'Periboston', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('787f3064-fd04-4cac-8db1-c68e5fedfc5e', 'd0393333-d785-4acb-94cc-58092e8356f5', 'Viên', 1, true, 535, 800);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('5e760e08-abc7-4189-9079-02d847862c1a', 'd0393333-d785-4acb-94cc-58092e8356f5', '010223', '2026-02-13', 0, 535);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('da9fd00e-724a-4adb-8199-6544b6e640ac', 'd0393333-d785-4acb-94cc-58092e8356f5', '030525', '2028-05-04', 278, 535);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('81224a9d-a64f-49f4-852c-a23c78ab5526', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001622', '8934618264665', 'Dorocron - MR 30mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('f62a680d-3abf-4021-b110-8a6be37192f9', '81224a9d-a64f-49f4-852c-a23c78ab5526', 'Viên', 1, true, 1150, 1250);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('0cd15c81-63b1-410d-ac1c-6af601facddb', '81224a9d-a64f-49f4-852c-a23c78ab5526', '00625', '2028-02-12', 0, 1150);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('d8ccdd6b-df94-4724-8066-bacc9fdd17ce', '81224a9d-a64f-49f4-852c-a23c78ab5526', '02325', '2028-10-03', 30, 1150);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('560fa666-1076-4c61-9512-84c3d6c11a0c', '81224a9d-a64f-49f4-852c-a23c78ab5526', '02825', '2028-12-11', 300, 1150);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('24b0ddf5-2d78-4188-b5a0-3d9fd3bfc85b', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001619', NULL, 'Diamicron MR 30mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('6e664f62-63f3-4f89-a732-66f79db34240', '24b0ddf5-2d78-4188-b5a0-3d9fd3bfc85b', 'Viên', 1, true, 3600, 3800);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('bc9f4c8a-be69-434a-b6c6-ad6cd331c853', '24b0ddf5-2d78-4188-b5a0-3d9fd3bfc85b', '6089262', '2026-10-10', 0, 3600);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('e63dd0f4-616b-47db-92b3-c5ecd45261b4', '24b0ddf5-2d78-4188-b5a0-3d9fd3bfc85b', '6116009', '2027-12-01', 60, 3600);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('33629ba8-83fe-4a48-b461-611794d7be9d', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001616', NULL, 'Glucophage 500mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('2b47bc2b-a04a-4827-a139-276018439fb8', '33629ba8-83fe-4a48-b461-611794d7be9d', 'Viên', 1, true, 1740, 1900);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('e3aeb019-403a-42a2-8957-9a6c70a88957', '33629ba8-83fe-4a48-b461-611794d7be9d', '9204', '2029-02-28', 0, 1740);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('c20be75c-c552-465c-9e29-3fe20ef3d953', '33629ba8-83fe-4a48-b461-611794d7be9d', 'Y10353', '2030-04-21', 139, 1740);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('2c2e2b4d-509a-4a65-aed8-7ef82c5cd1a2', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001613', NULL, 'Glucophage 850 mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('a3406540-e3a7-4b85-9b49-fab7db502c5d', '2c2e2b4d-509a-4a65-aed8-7ef82c5cd1a2', 'Viên', 1, true, 3400, 3500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('aafc3d46-1220-4aeb-9ecb-aaa126992607', '2c2e2b4d-509a-4a65-aed8-7ef82c5cd1a2', '8918', '2028-11-05', 300, 3400);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('69240ee8-3bb1-4d29-a144-8bacf86bad59', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001610', '8936024391423', 'Comiaryl 2mg/500mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('4bbba89c-d1ab-446f-8ace-9a7373e2a942', '69240ee8-3bb1-4d29-a144-8bacf86bad59', 'Viên', 1, true, 3000, 3100);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('f65c6084-b72b-4997-83ed-b115313d0d86', '69240ee8-3bb1-4d29-a144-8bacf86bad59', '5324', '2027-11-27', 210, 3000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('4c235165-7a74-4198-bb7d-6cda4f45ef3f', '69240ee8-3bb1-4d29-a144-8bacf86bad59', '06225', '2028-12-05', 0, 3000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('95bc5aac-01a0-4836-b1e3-c26704e476ac', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001607', '8936106320167', 'Glimepiride 4 mg sella', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('dfce4a7f-c517-467a-8cf2-a25b19374a24', '95bc5aac-01a0-4836-b1e3-c26704e476ac', 'Viên', 1, true, 1133, 2000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('e7951935-e19e-47fd-8215-1bd31d1e7c0f', '95bc5aac-01a0-4836-b1e3-c26704e476ac', '040724', '2027-07-12', 60, 1133);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('7c5c3fa5-f74c-416f-8576-b30878c853e0', '95bc5aac-01a0-4836-b1e3-c26704e476ac', '0', '2027-07-13', 150, 1133);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('238de1aa-a1ea-4244-88fc-bcdfc9702a05', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001604', '8934618322792', 'Glucofine 500mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('9b5554f6-7287-4532-bb60-3b74bfcf3a3e', '238de1aa-a1ea-4244-88fc-bcdfc9702a05', 'Viên', 1, true, 788, 900);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('924a6e6c-4cd5-4ec4-a167-309eaf15778c', '238de1aa-a1ea-4244-88fc-bcdfc9702a05', '02423', '2026-12-09', 452, 788);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('37f15b97-376e-4753-989d-fdc41eb693f5', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001601', '8936024390150', 'Hasanbest 500/2.5', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('743b8c1b-8b94-4aa4-b88b-45e3af47a25b', '37f15b97-376e-4753-989d-fdc41eb693f5', 'Viên', 1, true, 1400, 1600);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('5ed4a1f2-2c50-4422-8ed8-edc742843d74', '37f15b97-376e-4753-989d-fdc41eb693f5', '00624', '2027-02-25', 0, 1400);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('a4631f78-746f-40c0-bd6d-9f6243400303', '37f15b97-376e-4753-989d-fdc41eb693f5', '01425', '2028-08-21', 185, 1400);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('8513fe8a-9e17-4610-923c-9ece138d5cb2', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001598', '8936024391119', 'Hasanbest 500/5', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('74878a30-a0dd-4e4f-82fa-8a8c3dd81d65', '8513fe8a-9e17-4610-923c-9ece138d5cb2', 'Viên', 1, true, 1550, 1666);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('48e0d313-b7c4-43ac-a2ef-0e58ff7f09bb', '8513fe8a-9e17-4610-923c-9ece138d5cb2', '00625', '2028-04-01', 0, 1550);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('a06a782a-51dc-4791-a133-24666b71dc8b', '8513fe8a-9e17-4610-923c-9ece138d5cb2', '01525', '2028-10-17', 360, 1550);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('a38fb559-9f10-4954-9c8d-8245e34516c1', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001595', '8934690011096', 'Mefomid 850mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('934bba4d-850e-4b48-8af6-b9ae3367faf1', 'a38fb559-9f10-4954-9c8d-8245e34516c1', 'Viên', 1, true, 900, 1500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('33f1b50c-29c7-4038-b890-4ba6c952adfb', 'a38fb559-9f10-4954-9c8d-8245e34516c1', '24001', '2027-11-29', 0, 900);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('38ba6f5f-9a1f-40b1-92b1-5a1fdd0eada0', 'a38fb559-9f10-4954-9c8d-8245e34516c1', '25001', '2028-11-02', 440, 900);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('b569c212-3cd2-4180-977a-ddda452cf493', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001592', '8935076033022', 'Metformin 850mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('7d83b511-d6af-4ac7-82d8-9bee9c94b547', 'b569c212-3cd2-4180-977a-ddda452cf493', 'Viên', 1, true, 650, 1000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('ac922239-5a8c-4cf7-8298-8d9bcfbd8229', 'b569c212-3cd2-4180-977a-ddda452cf493', '210324', '2027-03-24', 780, 650);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('5d6f7823-2ef8-4459-9df4-cf168d74adf5', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001589', '8934690110195', 'Mefomid 500mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('42c8c73c-eda2-42bc-84e9-8e3c3be74599', '5d6f7823-2ef8-4459-9df4-cf168d74adf5', 'Viên', 1, true, 500, 700);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('993ecfc8-adf3-4f92-b54f-9126c4d51f51', '5d6f7823-2ef8-4459-9df4-cf168d74adf5', '23001', '2026-04-02', 0, 500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('c072c271-63a4-4da5-9cf7-ada97820899d', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001586', '4013054014523', 'Berlthyrox 100mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('c067ee12-4db3-4456-b5ed-70892402dc9d', 'c072c271-63a4-4da5-9cf7-ada97820899d', 'Viên', 1, true, 724, 800);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('5643938b-1513-4120-a7d4-ddc31520c379', 'c072c271-63a4-4da5-9cf7-ada97820899d', '015A', '2026-05-28', 50, 724);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('80a7091a-0806-4a7e-be2e-de7852523d3b', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001583', '8935022708097', 'Disthyrox 100mcg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('0ff4f9cf-9d07-4e1c-b950-040b86f72a11', '80a7091a-0806-4a7e-be2e-de7852523d3b', 'Viên', 1, true, 312, 1000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('f93ebb1f-9714-44ac-b7d6-f8f89658dca3', '80a7091a-0806-4a7e-be2e-de7852523d3b', '141224', '2026-12-03', 140, 312);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('fb7166f8-b1f3-4509-baaa-699b5cccc91a', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001579', NULL, 'Mebecar Chewtab', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('9b78e311-310e-49fa-86cc-bdd9d58bfb45', 'fb7166f8-b1f3-4509-baaa-699b5cccc91a', 'Viên', 1, true, 8900, 15000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('091516e0-b5cc-4d9c-b5bf-6368a108e6e5', 'fb7166f8-b1f3-4509-baaa-699b5cccc91a', '020525', '2028-05-15', 34, 8900);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('75b75d53-4e2a-4822-99ff-1a2b2622e804', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001576', '8936106320976', 'Lostad T25', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('aab71afb-6843-4484-a9a5-9f2feebedc74', '75b75d53-4e2a-4822-99ff-1a2b2622e804', 'Viên', 1, true, 1400, 1600);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('0ac99aa0-3592-43ae-bd71-91160f8b823e', '75b75d53-4e2a-4822-99ff-1a2b2622e804', '060325', '2028-03-08', 0, 1400);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('660e0e90-0c77-4050-8a71-9d7bad7eef7c', '75b75d53-4e2a-4822-99ff-1a2b2622e804', '070825', '2028-03-08', 140, 1400);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('9634eafc-76a4-42cd-934b-32bda0abde60', '75b75d53-4e2a-4822-99ff-1a2b2622e804', '211125', '2028-11-28', 150, 1400);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('18d985e2-07c5-4898-aa44-c5db808e3e21', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001573', NULL, 'Lincomycin 500mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('86862721-3819-47f1-b632-7668b6fb2149', '18d985e2-07c5-4898-aa44-c5db808e3e21', 'Viên', 1, true, 1040, 1500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('c16dee8a-00de-40a4-9366-52cf843954a0', '18d985e2-07c5-4898-aa44-c5db808e3e21', '040325', '2028-03-27', 21, 1040);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('ca1b1070-2932-4522-b9d2-10f607702576', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP001572', NULL, 'Bông 50G', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('4ee45d1c-95b5-4af7-900a-447834f889fd', 'ca1b1070-2932-4522-b9d2-10f607702576', 'Gói', 1, true, 10900, 15000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                VALUES ('97a12a27-03a4-4b3a-8233-e5d0283dad0f', 'ca1b1070-2932-4522-b9d2-10f607702576', 'LO-MACDINH', '2099-12-31', 50, 10900);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('2fdebca6-77c0-4629-a750-59366d9e063e', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP001571', NULL, 'Gạc tẩm Cồn', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('496b9f02-74e7-4db1-94a2-d386c28651ae', '2fdebca6-77c0-4629-a750-59366d9e063e', 'Hộp', 1, true, 16700, 0);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                VALUES ('88e452f4-046d-439d-a050-d083254a3a64', '2fdebca6-77c0-4629-a750-59366d9e063e', 'LO-MACDINH', '2099-12-31', 10, 16700);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('625b6c64-e83d-49c6-8719-cbc52e8e3cb8', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP001570', NULL, 'Thuốc Liều 11k', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('42e32f28-a2fc-4e3b-acb4-ee1b98679758', '625b6c64-e83d-49c6-8719-cbc52e8e3cb8', 'Viên', 1, true, 7000, 11000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('95dbf8de-2ca7-4c23-b870-7ed6b7192da0', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001564', '8936024390532', 'Meshanon 60mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('94d522f2-0acf-4875-8f01-f41eb35fbd94', '95dbf8de-2ca7-4c23-b870-7ed6b7192da0', 'Viên', 1, true, 4540, 5000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('5f05c7ae-27c2-441f-ad6d-66d8ec2eea93', '95dbf8de-2ca7-4c23-b870-7ed6b7192da0', '00523', '2026-11-08', 19, 4540);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('6c143fd3-5fd6-49ab-918d-d038273ed919', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001561', NULL, 'Voltaren 75mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('4d73a76c-3634-4e89-a6a5-fcfba83fb9d8', '6c143fd3-5fd6-49ab-918d-d038273ed919', 'Viên', 1, true, 6600, 7000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('12c6a886-defa-414c-be8d-38d4b01bc933', '6c143fd3-5fd6-49ab-918d-d038273ed919', 'TJJP7', '2027-08-01', 30, 6600);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('91d2d242-b09e-4839-bbdb-2127d387457f', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001557', NULL, 'Voltaren 50mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('34ad2e5a-f741-431a-aa2c-7daff3b5d37d', '91d2d242-b09e-4839-bbdb-2127d387457f', 'Viên', 1, true, 3750, 4000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('0a020888-76c4-4218-ac54-432a76b7ecde', '91d2d242-b09e-4839-bbdb-2127d387457f', 'A01CV2', '2026-09-01', 48, 3750);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('03dbc21c-ce8b-494d-b160-8507baac7162', '91d2d242-b09e-4839-bbdb-2127d387457f', 'A023FU', '2027-04-30', 100, 3750);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('6a8a3bdf-c0a3-494c-bbd3-ab18d5c97b50', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001554', NULL, 'Allopurinol 300mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('9a7a4808-92eb-4c81-bd20-e358500778dc', '6a8a3bdf-c0a3-494c-bbd3-ab18d5c97b50', 'Viên', 1, true, 700, 1000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('56c84db7-cc2b-477e-819f-2a8454fa33fb', '6a8a3bdf-c0a3-494c-bbd3-ab18d5c97b50', '2690325', '2028-03-18', 0, 700);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('8a3e4405-f867-405c-a4cf-cb6e2d92b77d', '6a8a3bdf-c0a3-494c-bbd3-ab18d5c97b50', '0', '2028-07-22', 0, 700);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('bc6de487-ec8f-4116-be61-a22ca00a38b6', '6a8a3bdf-c0a3-494c-bbd3-ab18d5c97b50', '0771125', '2028-12-03', 370, 700);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('11a6a33c-51c9-49e7-b271-634a9ecfa478', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001551', '8936085367795', 'Sinlukast 10mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('0700f778-ea76-4401-a2df-c609439212e8', '11a6a33c-51c9-49e7-b271-634a9ecfa478', 'Viên', 1, true, 1520, 2000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('98e6ea9b-1a2e-48f2-af2c-9db9a560204b', '11a6a33c-51c9-49e7-b271-634a9ecfa478', '010225', '2028-03-01', 0, 1520);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('598ab8bc-8153-4784-a2b9-f97960af0d43', '11a6a33c-51c9-49e7-b271-634a9ecfa478', '010525', '2028-05-20', 190, 1520);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('2340ba5c-28ec-4387-9cc3-dfecea0c42cd', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001546', NULL, 'Stadovas 5mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('f2f30c06-fa95-4a77-822f-030e4faf3d3f', '2340ba5c-28ec-4387-9cc3-dfecea0c42cd', 'Viên', 1, true, 680, 800);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('2f327352-963b-42b1-8f6c-f97dcf2b845a', '2340ba5c-28ec-4387-9cc3-dfecea0c42cd', '391224', '2028-12-02', 0, 680);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('8e168660-d93a-4d67-836c-f0d114ce829e', '2340ba5c-28ec-4387-9cc3-dfecea0c42cd', '210925', '2029-09-03', 0, 680);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('11442f15-049e-4c7f-8e11-d98a883c5f34', '2340ba5c-28ec-4387-9cc3-dfecea0c42cd', '250925', '2029-09-06', 160, 680);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('42118e07-aae2-4ebb-b719-00d86b3be9a5', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001544', NULL, 'Rectiofa 5', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('d9fabb3d-0630-49a6-99a7-81519e5a8193', '42118e07-aae2-4ebb-b719-00d86b3be9a5', 'Ống', 1, true, 4000, 4500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('e4313c3e-d800-43b0-be15-4db3c84e9440', '42118e07-aae2-4ebb-b719-00d86b3be9a5', '1210525', '2027-11-13', 0, 4000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('cd4de9c2-5b7c-4318-91d7-9a08622a5cac', '42118e07-aae2-4ebb-b719-00d86b3be9a5', '3041225', '2028-06-25', 99, 4000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('a87b2e23-23fe-45ec-8e93-30f36b029dda', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001541', NULL, 'Betaloc Zok 25mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('1a0649c6-a543-40ca-bceb-2f498adb2e5c', 'a87b2e23-23fe-45ec-8e93-30f36b029dda', 'Viên', 1, true, 5135, 5357);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('7aab01c5-45ed-444f-bafc-11b789a94545', 'a87b2e23-23fe-45ec-8e93-30f36b029dda', 'ZBBU', '2027-08-12', 0, 5135);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('7714cb4f-e46b-4c5f-b201-3ebc2ee4309b', 'a87b2e23-23fe-45ec-8e93-30f36b029dda', 'ZBDA', '2028-03-25', 84, 5135);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('551b2624-1541-4494-bfdd-6de60605bb25', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001536', '8936098965087', 'Zensalbu 2.5mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('d3a9bd07-8508-4ee6-9840-bb13043991c1', '551b2624-1541-4494-bfdd-6de60605bb25', 'Ống', 1, true, 4200, 5000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('9d9bb486-6070-4d3b-b88f-25507a300069', '551b2624-1541-4494-bfdd-6de60605bb25', '010625', '2028-06-24', 65, 4200);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('eeefd04f-e0e2-49c9-bfb5-0ada28f7d074', '551b2624-1541-4494-bfdd-6de60605bb25', '0', '2030-03-31', 0, 4200);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('9ad717fa-4dae-4c5b-9d1c-b4dca32dccd9', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP001534', '8935131206156', 'Omega 3', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('ccf52cb2-36a0-4718-bef3-6183302e9e8b', '9ad717fa-4dae-4c5b-9d1c-b4dca32dccd9', 'Viên', 1, true, 1500, 2000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('df590f50-6974-4645-b437-3e3eaed76149', '9ad717fa-4dae-4c5b-9d1c-b4dca32dccd9', '020', '2028-02-15', 191, 1500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('835a0fb2-873c-4c2b-bc29-212b7510ccbb', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP001525', '8936031641863', 'Ginkgo 12k', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('0e690644-ea05-44ab-9bc4-125395555512', '835a0fb2-873c-4c2b-bc29-212b7510ccbb', 'Viên', 1, true, 800, 1200);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('7eba4662-f416-4f42-b8c8-aaed917c1692', '835a0fb2-873c-4c2b-bc29-212b7510ccbb', '0', '2028-01-01', 0, 800);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('a1ee6211-bd81-4ed7-bffe-c3614ebf1239', '835a0fb2-873c-4c2b-bc29-212b7510ccbb', '010125', '2028-01-08', 0, 800);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('b29e1a8e-9869-452f-afab-7dbc035c6572', '835a0fb2-873c-4c2b-bc29-212b7510ccbb', '360925', '2028-09-23', 0, 800);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('cf6a794e-e43e-4fc6-ba28-267e6a5bba7d', '835a0fb2-873c-4c2b-bc29-212b7510ccbb', '080226', '2029-02-23', 1380, 800);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('8ac05bd9-aeed-44bc-a971-d311ed80c67c', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP001523', NULL, 'Hoạt huyết dưỡng não Đại Uy', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('daf771a7-de58-4732-ac57-e29e05f92b2c', '8ac05bd9-aeed-44bc-a971-d311ed80c67c', 'Vỉên', 1, true, 325, 400);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('16ad4a10-ad7e-4110-b857-874ffde1d01b', '8ac05bd9-aeed-44bc-a971-d311ed80c67c', '0125', '2028-01-08', 200, 325);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('eee8e625-0944-4049-96bf-9a210c4cde03', '6afa32c5-1630-49f2-9d0f-06168b96b389', 'SP001522', NULL, 'Miếng Dán Cọp', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('f5195728-6bcb-480f-afbb-26068bce86fd', 'eee8e625-0944-4049-96bf-9a210c4cde03', 'Gói', 1, true, 7000, 8000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('5f35cdd1-26ae-443f-9041-48e2cffa89f1', 'eee8e625-0944-4049-96bf-9a210c4cde03', '200225', '2028-02-19', 0, 7000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('903ab77f-e967-4b23-983d-84abae9d342f', 'eee8e625-0944-4049-96bf-9a210c4cde03', '250802', '2028-08-01', 181, 7000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('15a6b593-cb7b-4b74-9c26-11e2fcc0feca', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001519', '3384573', 'Tanganil 500mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('8a231a3f-8779-4e77-90e8-4d7a07377688', '15a6b593-cb7b-4b74-9c26-11e2fcc0feca', 'Viên', 1, true, 4390, 5000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('01f21e35-a629-44f9-87a8-7e4c5860f67d', '15a6b593-cb7b-4b74-9c26-11e2fcc0feca', '4G80U', '2027-12-01', 0, 4390);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('c4aad62f-a712-430f-8f82-69a6de4b8c93', '15a6b593-cb7b-4b74-9c26-11e2fcc0feca', '0', '2028-03-31', 0, 4390);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('15f3ae31-7ee3-429a-9a26-0019713a11c9', '15a6b593-cb7b-4b74-9c26-11e2fcc0feca', '5G2EU', '2028-08-31', 0, 4390);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('1ef8678f-d096-42ef-a224-d67103e9b3ea', '15a6b593-cb7b-4b74-9c26-11e2fcc0feca', '5G323', '2028-10-31', 50, 4390);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('710c4f22-5d82-4efe-81b1-4768651c2af2', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001514', '8934903003009', 'Otilin 15ml', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('019dccd2-37a2-44e1-b639-0a37d3396a50', '710c4f22-5d82-4efe-81b1-4768651c2af2', 'Lọ', 1, true, 20000, 22000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('2cb6f5f2-4d97-4f80-8a39-3e50d1e8040e', '710c4f22-5d82-4efe-81b1-4768651c2af2', '080425', '2027-04-08', 0, 20000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('5cf6c833-a50f-4f87-aa4d-67d6e314b9e3', '710c4f22-5d82-4efe-81b1-4768651c2af2', '135079', '2027-11-24', 9, 20000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('a75bf1a0-0814-4b00-b235-3aa965fdc0a3', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP001510', NULL, 'Băng Thun 3 Móc', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('f1590bc5-28eb-477d-8fd0-4bf483a07f12', 'a75bf1a0-0814-4b00-b235-3aa965fdc0a3', 'Gói', 1, true, 3000, 5000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('900dd1b6-6952-4249-9ccb-341eb6f5f723', 'a75bf1a0-0814-4b00-b235-3aa965fdc0a3', '010625', '2027-06-01', 7, 3000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('4b465e94-0afe-4597-a5da-e08887d5ee60', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001508', '8935071404018', 'Maxgel', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('ba7a1c32-5aca-409a-b2eb-7a35901e46f2', '4b465e94-0afe-4597-a5da-e08887d5ee60', 'Tuýp', 1, true, 13000, 15000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('9a8ea27f-b7da-4cc3-bc1d-e73bd213794f', '4b465e94-0afe-4597-a5da-e08887d5ee60', '2407117', '2026-07-16', 0, 13000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('663cd27b-051c-4fd7-86ea-a6a4db36ee77', '4b465e94-0afe-4597-a5da-e08887d5ee60', '2512224', '2027-12-13', 20, 13000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('df0e6d24-15e4-43ac-b8d3-27272dca1a3f', '6afa32c5-1630-49f2-9d0f-06168b96b389', 'SP001505', '8938505132174', 'Dầu Gió Xanh Thiên Thảo 12ml', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('087d9f81-154b-42b3-9c9a-3edf9d881428', 'df0e6d24-15e4-43ac-b8d3-27272dca1a3f', 'Chai', 1, true, 22225, 25000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('e8349efc-b02e-4ec1-a6fa-a714d954b261', 'df0e6d24-15e4-43ac-b8d3-27272dca1a3f', '010425', '2028-04-08', 5, 22225);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('723ca85a-f12d-488f-8547-40e4670c5ddf', 'df0e6d24-15e4-43ac-b8d3-27272dca1a3f', '040426', '2029-04-08', 12, 22225);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('8bad3883-7fb6-42fb-8d62-e2550d86fbf1', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001501', '8002660025418', 'Duphaston', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('1c78e982-74ff-4bfa-b52b-7eb655bacf55', '8bad3883-7fb6-42fb-8d62-e2550d86fbf1', 'Viên', 1, true, 11285, 12500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('be99062e-57e0-484d-a0f8-e32bebbc06fa', '8bad3883-7fb6-42fb-8d62-e2550d86fbf1', '374946', '2029-04-01', 4, 11285);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('8aec90d8-97cc-45e1-b1ae-a4ac1aa5a2e3', '8bad3883-7fb6-42fb-8d62-e2550d86fbf1', '378488', '2030-06-30', 40, 11285);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('b736e516-c60b-44e6-9f4d-30ff979be708', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP001500', '4014009356880', 'Xịt viga 50000', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('08da32ec-6747-465c-bbcf-7652f3bb6850', 'b736e516-c60b-44e6-9f4d-30ff979be708', 'Chai', 1, true, 0, 150000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('5ecc139a-e2d4-4017-bb3e-d9b42533f164', 'b736e516-c60b-44e6-9f4d-30ff979be708', '092024', '2029-09-01', 11, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('8906f24b-5697-4f79-8fc5-d70ff2cef210', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP001498', '8938542880540', 'Viên Ngậm Ho Nam Dược', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('eaca1214-1a43-4d39-b3f9-f190da8ed524', '8906f24b-5697-4f79-8fc5-d70ff2cef210', 'Vỉ', 1, true, 7000, 10000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('54fdd34a-ab03-423b-9fc8-54610bb37272', '8906f24b-5697-4f79-8fc5-d70ff2cef210', '2503', '2028-02-13', 0, 7000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('af952434-f527-4aff-bf88-e2815f2f6995', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001495', NULL, 'Sildenafil 100', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('58b5a177-ec10-4283-a012-86772bb3358d', 'af952434-f527-4aff-bf88-e2815f2f6995', 'Viên', 1, true, 8000, 30000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('ab5200c5-274d-4e43-92f0-a561a6c2582e', 'af952434-f527-4aff-bf88-e2815f2f6995', '0', '2026-11-01', 0, 8000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('58e9b9ca-f1e7-4820-a0a5-0c94dbd08c33', 'af952434-f527-4aff-bf88-e2815f2f6995', '417FS20', '2027-09-03', 0, 8000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('006ad79f-87d7-4419-8899-0126ca4f5aff', 'af952434-f527-4aff-bf88-e2815f2f6995', '417FS23', '2027-11-01', 0, 8000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('c9d74744-9577-4b48-ac73-1705e88fbaf4', 'af952434-f527-4aff-bf88-e2815f2f6995', '417fs24', '2027-12-01', 18, 8000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('7bd6e9d3-3d28-497a-b482-2cb6307dc139', 'af952434-f527-4aff-bf88-e2815f2f6995', 'APA01LKB', '2029-01-01', 60, 8000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('2ad75e67-c977-4e00-95ce-5fc6754a76bb', '6afa32c5-1630-49f2-9d0f-06168b96b389', 'SP001494', NULL, 'Vaseline Hương Dâu', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('8d9eaf32-9440-4ab9-8d18-9316b570ee50', '2ad75e67-c977-4e00-95ce-5fc6754a76bb', 'Tuýp', 1, true, 8400, 15000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('416609eb-f9db-45d7-bcd2-77a0e6f21e7e', '2ad75e67-c977-4e00-95ce-5fc6754a76bb', 'V001', '2026-12-06', 0, 8400);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('83b645da-cf6c-452a-8a29-16042bbb0496', '2ad75e67-c977-4e00-95ce-5fc6754a76bb', '0040725', '2028-07-10', 94, 8400);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('dbdf36c9-e4b4-437a-9223-2e22af96f92d', '6afa32c5-1630-49f2-9d0f-06168b96b389', 'SP001493', '8936036961232', 'Asa 12ml', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('5ba5baa9-ce98-4bd6-bf7f-31817deb1a3f', 'dbdf36c9-e4b4-437a-9223-2e22af96f92d', 'Chai', 1, true, 6300, 10000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('5fb7a0c5-94fd-4209-a1e9-d9f5f643c77b', 'dbdf36c9-e4b4-437a-9223-2e22af96f92d', '0', '2027-01-01', 14, 6300);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('7e391bf0-603b-4dea-8c43-6369f129600f', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001490', NULL, 'Berocca', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('6ca938bc-82ed-4197-b770-3d38fb5e3c3a', '7e391bf0-603b-4dea-8c43-6369f129600f', 'Viên', 1, true, 7000, 7500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('2d8fe99f-6958-4290-90e3-3e1cee2defa9', '7e391bf0-603b-4dea-8c43-6369f129600f', '6046', '2026-11-11', 0, 7000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('9cd0ae5e-4832-4871-8be9-3f14bacb3fc3', '7e391bf0-603b-4dea-8c43-6369f129600f', '0', '2027-05-07', 0, 7000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('6380aea0-5552-4642-8948-19a9f624ba73', '7e391bf0-603b-4dea-8c43-6369f129600f', '1782', '2027-06-18', 0, 7000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('4f471bc3-7e35-4229-abf0-5e76f9fe4f65', '7e391bf0-603b-4dea-8c43-6369f129600f', 'CM31719', '2027-06-23', 166, 7000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('3b17a784-81e8-41fb-a446-fcd7ad8e51f4', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP001488', '8936040074003', 'Bông 25g', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('233d271d-62ed-4dcb-b3a3-0de2752cd8f4', '3b17a784-81e8-41fb-a446-fcd7ad8e51f4', 'Gói', 1, true, 5000, 8000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('b6505ba7-5283-47c8-bc06-1d99555084ce', '3b17a784-81e8-41fb-a446-fcd7ad8e51f4', 'D21', '2026-12-01', 0, 5000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('589fc02e-c787-4eaf-83f1-f40f2a17b44c', '3b17a784-81e8-41fb-a446-fcd7ad8e51f4', 'd22', '2028-10-02', 69, 5000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('11d346c1-c559-4f1e-8030-00d0565613af', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP001484', NULL, 'Jex (Nhỏ )', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('72b26584-74a2-4726-b036-1bb4b15807dd', '11d346c1-c559-4f1e-8030-00d0565613af', 'Viên', 1, true, 295500, 11333);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('87a4bd17-f5e7-45af-afbf-75cad476ea23', '11d346c1-c559-4f1e-8030-00d0565613af', 'JN24012430', '2027-01-02', 30, 295500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('110472be-ab0b-4524-92c8-cb4d071699f9', '11d346c1-c559-4f1e-8030-00d0565613af', 'JN2706', '2027-09-11', 30, 295500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('5e5460cd-d015-4ff1-854f-39f02bfea6b4', '11d346c1-c559-4f1e-8030-00d0565613af', 'JN27062430', '2027-09-11', 0, 295500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('2a375be3-8c69-4b00-a1d8-db8c97c06e13', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP001483', '8936040074355', 'Bông viên', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('c68b74e6-e61f-4cd4-bd7a-1b2e873aafc8', '2a375be3-8c69-4b00-a1d8-db8c97c06e13', 'Gói', 1, true, 0, 10000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('ea445855-5030-4aa7-a95d-85212b435f7a', '2a375be3-8c69-4b00-a1d8-db8c97c06e13', '0', '2027-01-01', 0, 0);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('d610fcf1-3fe4-475c-886f-4d5df25d0dd3', '2a375be3-8c69-4b00-a1d8-db8c97c06e13', 'd25', '2028-04-16', 0, 0);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('4b853c30-b4ab-46a5-b84a-e7c924cff56b', '2a375be3-8c69-4b00-a1d8-db8c97c06e13', 'd17', '2028-07-15', 44, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('2014dd11-d661-487c-8d10-2d0605a2fed7', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP001480', '8936109560287', 'Men Biolac Plus', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('0936a138-fe22-47e6-9075-1c856937354e', '2014dd11-d661-487c-8d10-2d0605a2fed7', 'Viên', 1, true, 500, 1000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('50e53bec-2d92-4854-9ec9-d01c3d7771f4', '2014dd11-d661-487c-8d10-2d0605a2fed7', '022501', '2028-01-03', 130, 500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('02562f9e-d58f-4569-82c5-1b2ce7e77e63', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001472', NULL, 'Levothyrox 50', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('9f4bb272-1f50-4e88-95d6-45d763436256', '02562f9e-d58f-4569-82c5-1b2ce7e77e63', 'Viên', 1, true, 1293, 1666);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('2e6a5746-ef25-4609-bf6f-d6f9f64cffb9', '02562f9e-d58f-4569-82c5-1b2ce7e77e63', '29NF', '2027-04-20', 100, 1293);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('67da0391-5175-4435-9c84-87ba9378ba6a', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001470', '8936145281030', 'Sorbitol 5g', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('29a02fec-778a-4f58-9a05-30942e4774e5', '67da0391-5175-4435-9c84-87ba9378ba6a', 'Gói', 1, true, 1310, 2500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('59df2fab-2c39-4166-b5a5-0963dfbc9073', '67da0391-5175-4435-9c84-87ba9378ba6a', '325', '2028-02-27', 104, 1310);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('c4c7f747-6995-4c2b-a5e0-431bd18c2697', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001468', '8935269911113', 'Diosmectite 3g', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('219d43f8-f811-4808-abd4-7325afcac885', 'c4c7f747-6995-4c2b-a5e0-431bd18c2697', 'Gói', 1, true, 1850, 3000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('c40fbf65-1719-44b4-991f-af2e51d8d985', 'c4c7f747-6995-4c2b-a5e0-431bd18c2697', '504127', '2028-03-12', 86, 1850);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('e2f97847-270e-4dae-86c0-745bb250efbd', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001465', NULL, 'Pruzitin', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('8e051a8c-0896-442d-86b1-df85b7d294c5', 'e2f97847-270e-4dae-86c0-745bb250efbd', 'Viên', 1, true, 250, 500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('2674b04a-4424-4a73-8789-768910fc7658', 'e2f97847-270e-4dae-86c0-745bb250efbd', '4551223', '2027-01-09', 60, 250);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('bccef521-e825-4a59-9b3a-67848eefc9de', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001462', NULL, 'Kamelox 15', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('252948ab-795a-4b9f-a6dd-a27643bfc03e', 'bccef521-e825-4a59-9b3a-67848eefc9de', 'Viên', 1, true, 210, 500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('ac7947d5-12e5-4f49-92c3-7eabfb9abec3', 'bccef521-e825-4a59-9b3a-67848eefc9de', '2130624', '2027-06-19', 430, 210);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('e560ce12-5b94-4d8b-937a-f30043611f35', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001459', '8936014585368', 'Atheren', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('9dc3bf4e-2a54-4609-a4ff-3a7a5f98c062', 'e560ce12-5b94-4d8b-937a-f30043611f35', 'Viên', 1, true, 390, 600);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('b75ebf25-f72d-4b82-921c-5cb7b85eac06', 'e560ce12-5b94-4d8b-937a-f30043611f35', '040723', '2026-07-12', 225, 390);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('72423edf-b0da-4fa8-9d51-e18da696a294', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP001456', '8936010467019', 'Vitamin PP 5mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('79ed8863-6f52-40e0-be9d-4ae8a7946d09', '72423edf-b0da-4fa8-9d51-e18da696a294', 'Viên', 1, true, 251, 500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('4f3f25ec-6240-4b3a-87ea-38459ef809a1', '72423edf-b0da-4fa8-9d51-e18da696a294', '0', '2027-04-27', 300, 251);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('3142a7e5-21ec-44eb-84d2-9cf7c6fa39ee', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001453', '8935206020823', 'Telfor 120mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('258589e6-897d-4a3f-9c76-7c033bf06e50', '3142a7e5-21ec-44eb-84d2-9cf7c6fa39ee', 'Viên', 1, true, 2480, 2600);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('99d29329-a5c5-4c3f-adb9-f6127f1837de', '3142a7e5-21ec-44eb-84d2-9cf7c6fa39ee', '140424', '2026-04-14', 0, 2480);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('11a75089-9a6a-46e4-9f89-eb1d6925e7d3', '3142a7e5-21ec-44eb-84d2-9cf7c6fa39ee', '240425', '2027-04-24', 7, 2480);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('ffd5b32e-ea3b-4c71-a9d5-122221c376fb', '3142a7e5-21ec-44eb-84d2-9cf7c6fa39ee', '010326', '2028-03-16', 100, 2480);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('38dae303-db53-4eae-b29b-14482e975ffb', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001450', '8935206020816', 'Telfor 60mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('2776634c-6d72-4c1f-b516-04effd68d908', '38dae303-db53-4eae-b29b-14482e975ffb', 'Viên', 1, true, 1365, 2000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('32abf8e0-2730-4480-a0b8-af83bb538677', '38dae303-db53-4eae-b29b-14482e975ffb', '230824', '2027-08-23', 0, 1365);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('8a3c92f4-cec7-463f-a9c6-6f04e1899655', '38dae303-db53-4eae-b29b-14482e975ffb', '010225', '2028-02-27', 18, 1365);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('bd80ac27-7665-480e-9fb6-49298beae71a', '38dae303-db53-4eae-b29b-14482e975ffb', '021225', '2028-12-02', 100, 1365);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('beef07e5-4440-4c20-9b57-28ff7c460170', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001449', NULL, 'Fugacar 500mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('ac30f268-ca4e-4850-912b-6f0c2a7c8119', 'beef07e5-4440-4c20-9b57-28ff7c460170', 'Hộp', 1, true, 21200, 25000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('1675d4b9-b4f1-4405-ab95-f88d4549caf5', 'beef07e5-4440-4c20-9b57-28ff7c460170', '2401', '2027-11-04', 0, 21200);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('f52f0611-cb4f-403b-b461-bdbaee655f85', 'beef07e5-4440-4c20-9b57-28ff7c460170', '0', '2028-01-02', 0, 21200);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('ee081879-13c4-46b1-acf6-3e20005e1c74', 'beef07e5-4440-4c20-9b57-28ff7c460170', '25GQ032', '2028-07-01', 0, 21200);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('90f1ebd7-deab-44b2-9736-57f05631b65d', 'beef07e5-4440-4c20-9b57-28ff7c460170', '2595009', '2030-10-28', 13, 21200);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('2e1a8d5a-224f-4197-9b42-289b80a0ea4a', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001447', NULL, 'Smecta 3g', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('90dc6776-f8d6-44e8-b217-8ede77f00814', '2e1a8d5a-224f-4197-9b42-289b80a0ea4a', 'Gói', 1, true, 4600, 5000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('531e1694-dd93-42b6-9477-c0b3c30a1753', '2e1a8d5a-224f-4197-9b42-289b80a0ea4a', '1435', '2026-09-12', 0, 4600);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('77936831-a318-40cd-842e-d72176235295', '2e1a8d5a-224f-4197-9b42-289b80a0ea4a', '52357', '2027-03-28', 6, 4600);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('3eb15655-d478-48f5-8129-fe00d74858f7', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP001445', '8936123411442', 'Enterogermina', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('64ee2333-ed19-4a6e-8fb8-cef8df5fa51b', '3eb15655-d478-48f5-8129-fe00d74858f7', 'Ống', 1, true, 8200, 9000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('93a46ea8-7dad-4e94-b1e3-1e695e53f696', '3eb15655-d478-48f5-8129-fe00d74858f7', '0', '2027-02-28', 0, 8200);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('75616c7f-a8a0-483f-8e03-10b64c04f162', '3eb15655-d478-48f5-8129-fe00d74858f7', '5L128', '2027-02-28', 0, 8200);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('58bec942-73d6-429a-b05a-73ea15aa88a4', '3eb15655-d478-48f5-8129-fe00d74858f7', '5i199', '2027-03-31', 0, 8200);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('477390d3-accd-4c68-97e5-88e899c0433c', '3eb15655-d478-48f5-8129-fe00d74858f7', '5l355', '2027-06-30', 64, 8200);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('5dadfc45-64a1-44e5-a40e-21dc26a08c25', '3eb15655-d478-48f5-8129-fe00d74858f7', '6I012', '2027-12-31', 40, 8200);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('6562283d-14bc-4a5d-8817-fc7116a93330', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001442', NULL, 'Bisacodyl', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('08e64167-e4ae-4d42-ab48-86c80757713d', '6562283d-14bc-4a5d-8817-fc7116a93330', 'Viên', 1, true, 592, 700);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('3eedcc30-9f10-49ef-897f-51f874447bfa', '6562283d-14bc-4a5d-8817-fc7116a93330', '020225', '2028-02-03', 85, 592);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('241d3f61-3b38-4d26-9e16-9ee1da6cced6', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001439', NULL, 'Clorpheniramin 4mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('b847bfa7-76c0-49ea-a159-d2d68e1bafb3', '241d3f61-3b38-4d26-9e16-9ee1da6cced6', 'Viên', 1, true, 67, 150);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('c80e5dba-a118-4545-aab7-2c66722ffd14', '241d3f61-3b38-4d26-9e16-9ee1da6cced6', '0', '2028-01-01', 0, 67);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('90f61aac-f9c9-4f14-b217-9dc2637859a9', '241d3f61-3b38-4d26-9e16-9ee1da6cced6', '10571225', '2028-12-18', 10180, 67);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('1b84494d-8f84-4dcb-81bc-18f41c30c4f2', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP001435', '8936098967296', 'Companity', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('05181b6d-f005-4986-9df5-9d311e32f726', '1b84494d-8f84-4dcb-81bc-18f41c30c4f2', 'Gói', 1, true, 4100, 6000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('97f8cc14-78a4-4136-bb99-7ab9b723fdd6', '1b84494d-8f84-4dcb-81bc-18f41c30c4f2', '020924', '2027-09-10', 113, 4100);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('83afbdcd-5994-4739-8356-c3e2066ef7e6', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001432', NULL, 'Ampicilin 500mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('377624ee-172c-4b69-8001-006522b05bca', '83afbdcd-5994-4739-8356-c3e2066ef7e6', 'Viên', 1, true, 734, 1000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('503ee3ae-3420-48f8-8673-38dcbe204382', '83afbdcd-5994-4739-8356-c3e2066ef7e6', '361124', '2027-11-13', 0, 734);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('78272231-9e42-4b47-9fc3-1c34cddc321f', '83afbdcd-5994-4739-8356-c3e2066ef7e6', '025', '2027-12-22', 428, 734);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('0a1d4d8a-0d33-448e-bc51-5c289e724fdc', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001426', '8935206020830', 'Telfor 180mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('21bbb8f2-bf48-4216-a9bb-36009a26069f', '0a1d4d8a-0d33-448e-bc51-5c289e724fdc', 'Viên', 1, true, 2850, 3200);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('25501b7b-3222-4b88-8754-0c2a49900c5c', '0a1d4d8a-0d33-448e-bc51-5c289e724fdc', '030923', '2025-09-14', 0, 2850);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('2657d4ab-f748-490f-a52a-cba935f0a598', '0a1d4d8a-0d33-448e-bc51-5c289e724fdc', '030425', '2027-04-12', 0, 2850);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('dd0120b9-1269-42f9-94d3-286284a367bb', '0a1d4d8a-0d33-448e-bc51-5c289e724fdc', '031025', '2027-10-10', 61, 2850);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('27c093ab-c399-493d-b958-b71f282760bd', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001423', NULL, 'Berberin', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('0c2a6911-75b4-4a43-adec-8a8cc2c4c540', '27c093ab-c399-493d-b958-b71f282760bd', 'Viên', 1, true, 0, 600);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('64f65d98-b6e2-445b-902f-fb0dc07e33bf', '27c093ab-c399-493d-b958-b71f282760bd', '24001', '2026-01-20', 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('a44bf625-a662-4050-b39a-8392f5d074c4', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001420', '882844', 'Midasol', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('3d1956f8-5cbf-444e-9d15-9369f7c93c84', 'a44bf625-a662-4050-b39a-8392f5d074c4', 'Viên', 1, true, 1667, 2000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('0e31082a-a732-4783-b024-159cd84b079d', 'a44bf625-a662-4050-b39a-8392f5d074c4', '441224', '2027-01-25', 420, 1667);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('66cfbd29-9a96-46d3-907b-da246a77d961', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001419', '8935071408016', 'Pentinox 400mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('393ea52b-34f2-46be-b23b-4a84978faf74', '66cfbd29-9a96-46d3-907b-da246a77d961', 'Viên', 1, true, 5350, 10000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('192f6c76-6289-4968-84fb-c3301a451cab', '66cfbd29-9a96-46d3-907b-da246a77d961', '2406003', '2027-06-08', 49, 5350);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('acc14d58-c171-47e4-899e-6e91b9db190d', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001416', '8935244600858', 'Alpha chymotrypsin', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('1c18f1da-cfc6-426d-8388-cf186a0b6be9', 'acc14d58-c171-47e4-899e-6e91b9db190d', 'Viên', 1, true, 200, 500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('a7b20f6e-5a6c-4e65-93c6-6785a6b0412e', 'acc14d58-c171-47e4-899e-6e91b9db190d', '0', '2027-01-01', 0, 200);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('a671cb6a-e94c-4070-a6f1-73c98d7b490a', 'acc14d58-c171-47e4-899e-6e91b9db190d', '3626', '2028-04-18', 0, 200);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('54ebfae9-0f18-4956-a9f5-6c4e355ff6b8', 'acc14d58-c171-47e4-899e-6e91b9db190d', '3826', '2028-04-28', 500, 200);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('0b381a42-3621-4d99-bd58-19a3e62b794e', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001414', '8002660041920', 'Duphalac', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('35342e5b-ff2c-4dbe-b90b-d20220800806', '0b381a42-3621-4d99-bd58-19a3e62b794e', 'Gói', 1, true, 6835, 7500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('08364cb6-422c-4c2c-b7a9-5c6e18e98cc4', '0b381a42-3621-4d99-bd58-19a3e62b794e', '373247', '2026-01-01', 0, 6835);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('ca583b33-1124-4f01-ac7c-1978477c5579', '0b381a42-3621-4d99-bd58-19a3e62b794e', '0', '2027-06-30', 0, 6835);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('9655cc57-de6a-4c0f-b1e0-e76e6504cb12', '0b381a42-3621-4d99-bd58-19a3e62b794e', '379331', '2027-07-31', 28, 6835);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('2110dc69-8e0d-4ee3-bb43-625a7b732e22', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP001412', '8938501045119', 'Vitamin 3B Daktin', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('7e3f8b3f-aabc-49aa-a337-8eee42013558', '2110dc69-8e0d-4ee3-bb43-625a7b732e22', 'Viên', 1, true, 220, 500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('2cf7e221-999d-416f-b102-8f578ca2fbe9', '2110dc69-8e0d-4ee3-bb43-625a7b732e22', '300725', '2027-07-30', 0, 220);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('a906b7fb-4086-4bf6-bad9-b5959a0fdb0b', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001409', '8936064217530', 'Agifuros 40mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('00834986-f987-4008-b84a-bbc3e225b063', 'a906b7fb-4086-4bf6-bad9-b5959a0fdb0b', 'Viên', 1, true, 184, 250);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('ef005941-2fb6-4ab2-924e-145a81f7a12d', 'a906b7fb-4086-4bf6-bad9-b5959a0fdb0b', '050824', '2027-08-30', 794, 184);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('b3a08de9-59f0-46b3-a715-60e455d23a5b', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP001407', '8934690101377', 'Oresol new', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('eeb7ea7a-4f67-48f7-b53e-792d3054dc91', 'b3a08de9-59f0-46b3-a715-60e455d23a5b', 'Gói', 1, true, 1105, 2500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('5e580d6c-6118-42ef-bd64-b4e87df55cf7', 'b3a08de9-59f0-46b3-a715-60e455d23a5b', '24056', '2027-11-04', 0, 1105);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('174ab946-7c18-463f-8516-dfeaa15d7715', 'b3a08de9-59f0-46b3-a715-60e455d23a5b', '25056', '2028-11-14', 0, 1105);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('02b6a4a5-d29c-4ed3-a559-2721044446aa', 'b3a08de9-59f0-46b3-a715-60e455d23a5b', '25057', '2028-12-02', 409, 1105);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('e50f5fad-6ef4-45db-8e8a-cbcd107c3637', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001404', '8935206016376', 'Omeprazol DHG', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('4db3f763-d515-49f9-bd95-6c9940413398', 'e50f5fad-6ef4-45db-8e8a-cbcd107c3637', 'Viên', 1, true, 726.7, 1000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('842ef50e-6f47-411a-a1f2-3256c59f5716', 'e50f5fad-6ef4-45db-8e8a-cbcd107c3637', '0', '2028-06-11', 0, 726.7);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('8e9d9fcf-a134-4d46-91a9-bae2cb6cb660', 'e50f5fad-6ef4-45db-8e8a-cbcd107c3637', '381125', '2028-11-15', 0, 726.7);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('e062b5f6-6bc3-4094-8708-0c729d25e383', 'e50f5fad-6ef4-45db-8e8a-cbcd107c3637', '371225', '2028-12-30', 0, 726.7);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('453aec2a-cd83-4057-9bd9-734fd0845bb2', 'e50f5fad-6ef4-45db-8e8a-cbcd107c3637', '010226', '2029-02-05', 190, 726.7);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('298775cf-c2ba-4bc6-92b3-c637734c60a9', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP001401', NULL, 'Dizzo', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('3f0cb439-0155-4f3b-a1d0-6af173027f15', '298775cf-c2ba-4bc6-92b3-c637734c60a9', 'Viên', 1, true, 3633, 4000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('4ed75dbc-8f45-4bd0-af93-44180182bb09', '298775cf-c2ba-4bc6-92b3-c637734c60a9', '0224', '2027-07-30', 96, 3633);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('8006daae-042a-47b5-b270-d6f119207fa7', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001395', NULL, 'Vitamin C 500mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('3b322bfb-a4b9-4863-b9fd-361beaf7c194', '8006daae-042a-47b5-b270-d6f119207fa7', 'Viên', 1, true, 329, 500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('15d38976-ae2b-4b4d-9b1f-b4fd9874bde7', '8006daae-042a-47b5-b270-d6f119207fa7', '0', '2027-06-09', 0, 329);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('2c5e9914-1949-4876-b2fa-f786e40e0d2e', '8006daae-042a-47b5-b270-d6f119207fa7', '0624', '2027-10-12', 360, 329);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('b89320cf-3a48-4bb9-9198-18d33bb5f669', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001389', '8936123411176', 'Nautamine', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('02691db5-7af4-4948-9ab5-8b65ef9e2b1d', 'b89320cf-3a48-4bb9-9198-18d33bb5f669', 'Viên', 1, true, 2968, 4000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('f8f3b7ec-c12d-45c8-9701-524d4d95ab6f', 'b89320cf-3a48-4bb9-9198-18d33bb5f669', 'EVH2709', '2027-10-30', 0, 2968);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('3f373628-1300-4531-9572-2ce21d761539', 'b89320cf-3a48-4bb9-9198-18d33bb5f669', 'FVH1572', '2028-07-10', 123, 2968);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('8a34b904-18f7-420a-9fe7-a5cc3e1e6fa7', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001386', NULL, 'Amitriptylin 25mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('420e183e-0aa3-498d-a0e6-8f379b8dbbb5', '8a34b904-18f7-420a-9fe7-a5cc3e1e6fa7', 'Viên', 1, true, 206, 500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('427775b6-5bf8-4fa5-a4e6-60b8ae476856', '8a34b904-18f7-420a-9fe7-a5cc3e1e6fa7', '4441024', '2027-10-22', 363, 206);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('dc885147-a7b0-4a34-aa12-6a4fc066ab54', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001380', '99160364', 'Stugeron', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('29ab5711-41a5-4a70-b285-9db86ecd0bbb', 'dc885147-a7b0-4a34-aa12-6a4fc066ab54', 'Viên', 1, true, 743, 1000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('38e32c05-8ca2-4dd4-8514-f8ad452ed9ea', 'dc885147-a7b0-4a34-aa12-6a4fc066ab54', '2301040', '2028-04-28', 440, 743);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('0f7ad961-e65b-475e-aac7-c78a68f58c75', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001378', '8936098963489', 'Ginsil', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('f5c79bf8-9b62-4373-a28d-b756f427aae6', '0f7ad961-e65b-475e-aac7-c78a68f58c75', 'Ống', 1, true, 3000, 6000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('e20b07f1-6e1a-4fb1-83b4-7ddc239f8028', '0f7ad961-e65b-475e-aac7-c78a68f58c75', '0039036', '2027-02-07', 0, 3000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('4bf7bfb3-a5eb-45fd-a073-8c5de232c41a', '0f7ad961-e65b-475e-aac7-c78a68f58c75', '0', '2028-08-13', 60, 3000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('5083c1d7-b173-4972-b703-a0e3fcc52309', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001372', '8936064210975', 'Agicetam 800', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('b0e66cea-e077-4c23-adea-75a3447c415a', '5083c1d7-b173-4972-b703-a0e3fcc52309', 'Viên', 1, true, 890, 1000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('6056ad82-ac98-4f4a-9be1-47261b49536a', '5083c1d7-b173-4972-b703-a0e3fcc52309', '110325', '2028-04-01', 0, 890);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('1152db50-a3e7-4ebb-b67c-7101fd25018f', '5083c1d7-b173-4972-b703-a0e3fcc52309', '010126', '2029-03-06', 720, 890);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('2c895631-1a45-438f-ae57-b12e9e22afde', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001369', NULL, 'Tanponai 500mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('f04e086a-1797-4ad7-af2a-00421d535131', '2c895631-1a45-438f-ae57-b12e9e22afde', 'Viên', 1, true, 425, 1500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('16421cf6-ff5e-43d3-af92-66e2da22c70a', '2c895631-1a45-438f-ae57-b12e9e22afde', '731124', '2027-11-23', 0, 425);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('1f31e467-955a-4130-9e1f-5c5c6b5be559', '2c895631-1a45-438f-ae57-b12e9e22afde', '721225', '2028-12-15', 182, 425);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('de9d2863-69e3-4338-a86e-24f2c5ea7ebe', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001366', '8934567001267', 'MIMOSA VIÊN AN THẦN', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('854376aa-41ba-4ded-8a64-a06add8b0a1f', 'de9d2863-69e3-4338-a86e-24f2c5ea7ebe', 'Viên', 1, true, 831, 2000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('82f11c20-f9ab-44fc-81f8-ebfb85263ec1', 'de9d2863-69e3-4338-a86e-24f2c5ea7ebe', '24038', '2027-11-19', 0, 831);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('4b18fafc-77c9-45cd-aa86-4c78ee167e86', 'de9d2863-69e3-4338-a86e-24f2c5ea7ebe', '25041', '2028-12-08', 65, 831);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('cefde23c-c9ca-4c5d-bf6f-107bd8120d8d', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001363', NULL, 'Magnesium-B6', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('59d3eb3c-73a8-485c-ad64-e3bbc59e6340', 'cefde23c-c9ca-4c5d-bf6f-107bd8120d8d', 'Viên', 1, true, 800, 1000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('5cdc4df5-1390-40f2-a871-6296f3cac966', 'cefde23c-c9ca-4c5d-bf6f-107bd8120d8d', '25002', '2028-02-08', 1280, 800);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('af5492fa-c9ec-403e-8c49-47faf67b0003', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001362', '8936008134466', 'Dimedrol ( Thuốc Tiêm )', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('ffd9a4d8-f11b-43c1-9e30-cdbb5f537eee', 'af5492fa-c9ec-403e-8c49-47faf67b0003', 'Ống', 1, true, 1000, 50000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('16a7da7a-afef-46a9-9867-1ff9f75efa87', 'af5492fa-c9ec-403e-8c49-47faf67b0003', '824', '2027-08-13', 79, 1000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('62e05f1d-5daf-4015-8a71-2a2bfb2a1028', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001356', '8935049904083', 'Trihexyphenidyl', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('912a33af-d9b3-4c52-bd1d-9a9b95ae13c7', '62e05f1d-5daf-4015-8a71-2a2bfb2a1028', 'Viên', 1, true, 178, 250);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('99274bfc-8077-41b5-84eb-c8975d2a6a2d', '62e05f1d-5daf-4015-8a71-2a2bfb2a1028', '0151024', '2027-10-14', 320, 178);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('f0ce3891-1d1a-4010-80ad-1e65bb82b594', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001352', '8936004133128', 'Neo-megyna', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('b023723c-f7f2-4183-b4df-7f30ecc838f4', 'f0ce3891-1d1a-4010-80ad-1e65bb82b594', 'Viên', 1, true, 2380, 5000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('01ea3089-b16e-4a36-8d9f-76ae50bf1c83', 'f0ce3891-1d1a-4010-80ad-1e65bb82b594', '001224', '2027-11-04', 3, 2380);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('3287dc98-5bd6-400b-9aac-7c5c7879931c', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001344', '8936123411206', 'Magne B6 corbiere', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('96a638d1-c3bb-41ad-ae56-52b73c7813a3', '3287dc98-5bd6-400b-9aac-7c5c7879931c', 'Viên', 1, true, 1938, 2100);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('f7849701-d192-4706-9dd3-35429022127e', '3287dc98-5bd6-400b-9aac-7c5c7879931c', 'EVH0517', '2026-03-03', 0, 1938);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('778c21be-a13c-45ea-8b7b-e0b72f72fc81', '3287dc98-5bd6-400b-9aac-7c5c7879931c', '2827', '2027-12-04', 0, 1938);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('187a25cb-c9e7-4bc0-b39f-7c632bc6e529', '3287dc98-5bd6-400b-9aac-7c5c7879931c', 'FVH2895', '2027-12-09', 150, 1938);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('9ca12726-fd0e-4587-b993-d02a5595448f', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001341', NULL, 'Betaserc 16mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('21ab1669-69ce-4cf1-9f43-adf0b42459a1', '9ca12726-fd0e-4587-b993-d02a5595448f', 'Viên', 1, true, 3833, 4000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('970a2853-08fc-404c-82c3-c9c59f547161', '9ca12726-fd0e-4587-b993-d02a5595448f', '0', '2027-08-31', 65, 3833);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('e834d504-3efe-4814-a751-258eba57ec03', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001338', '8846000182726', 'Bromalex', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('18876ec6-d042-4b53-ac55-2be6f9081bc7', 'e834d504-3efe-4814-a751-258eba57ec03', 'Viên', 1, true, 5700, 15000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('c2741664-5005-4ce9-a3ca-1e75ad749761', 'e834d504-3efe-4814-a751-258eba57ec03', '0', '2027-01-01', 0, 5700);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('183aaa19-5db8-4400-8e2f-67a03a2ab55e', 'e834d504-3efe-4814-a751-258eba57ec03', '628', '2028-04-01', 163, 5700);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('77618fe2-b548-4705-b970-0f6660744328', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001335', '8936061376919', 'Masopen 250/25', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('7a15a346-3616-4399-bb9e-ffd46eb0c953', '77618fe2-b548-4705-b970-0f6660744328', 'Viên', 1, true, 4000, 4333);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('b5281771-2b66-44c2-8e0a-e1335e5d1d7f', '77618fe2-b548-4705-b970-0f6660744328', '00324', '2027-02-16', 10, 4000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('361587c4-141a-4bdd-8799-457737689543', '77618fe2-b548-4705-b970-0f6660744328', '02325', '2028-10-24', 30, 4000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d5f0bef3-f422-47a4-a0d3-cf138b61befd', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001333', NULL, 'Meyermazol 500', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('29b38c47-d178-4142-a3c0-464b0e91553e', 'd5f0bef3-f422-47a4-a0d3-cf138b61befd', 'Viên', 1, true, 6300, 7500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('dc8a3000-3013-475e-bce1-605c1f110033', 'd5f0bef3-f422-47a4-a0d3-cf138b61befd', '0160', '2026-03-10', 0, 6300);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('dba34ea1-a2f3-41b0-b39f-1f6be292aa20', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001330', '8936134270991', 'Mezapizin 10', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('a25ef7c3-197c-46b7-b639-5b11a57ecad8', 'dba34ea1-a2f3-41b0-b39f-1f6be292aa20', 'Viên', 1, true, 835, 1000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('073d772d-5340-4f77-b657-e0eec24aa184', 'dba34ea1-a2f3-41b0-b39f-1f6be292aa20', '011124', '2027-11-13', 0, 835);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('406550f5-a3cd-4406-8dc4-fad6babb0c24', 'dba34ea1-a2f3-41b0-b39f-1f6be292aa20', '010225', '2028-02-21', 200, 835);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('9867246e-90ff-46e2-bbf3-7c41631b2d35', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001329', '28068726', 'Becozyme', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('9e0c4572-9c46-4eae-b930-c56c4b466a0d', '9867246e-90ff-46e2-bbf3-7c41631b2d35', 'Ống', 1, true, 13750, 80000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('378087cd-8688-4a78-8e53-e2cc03b2e9e0', '9867246e-90ff-46e2-bbf3-7c41631b2d35', '225', '2028-02-21', 133, 13750);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('5441c6bf-65c9-4905-8ea1-cf2187d790ad', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001323', NULL, 'Panadol Extra', true, '4f0897b5-b56e-41ca-9046-9d20dbdf6988', 'Extra');
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('6303d889-4f74-4e49-b9ad-c0d7ef834589', '5441c6bf-65c9-4905-8ea1-cf2187d790ad', 'Viên', 1, true, 1277, 1333);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('efe088f9-c670-4244-a151-7dd0eb14c17a', '5441c6bf-65c9-4905-8ea1-cf2187d790ad', '0', '2027-01-01', 0, 1277);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('9e7fa11d-dcdd-4267-8a05-2f2a9294ece0', '5441c6bf-65c9-4905-8ea1-cf2187d790ad', 'EVH2741', '2027-12-04', 0, 1277);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('01228d2d-e7e4-4208-b723-a6c44852f072', '5441c6bf-65c9-4905-8ea1-cf2187d790ad', 'LL3N', '2028-10-19', 0, 1277);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('c624fdb4-3912-4a3b-8901-358b8781b7b0', '5441c6bf-65c9-4905-8ea1-cf2187d790ad', 'TD35', '2029-01-11', 2670, 1277);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d0b397f6-062d-4f82-bcd6-3ae86c3b2c4f', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001319', NULL, 'Panadol', true, '4f0897b5-b56e-41ca-9046-9d20dbdf6988', 'Mặc định');
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('ebb98592-2c89-4689-adf8-fde8b46b6f24', 'd0b397f6-062d-4f82-bcd6-3ae86c3b2c4f', 'Viên', 1, true, 875, 1000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('fe5dffa3-2cb5-4660-befe-1b65a7aec60e', 'd0b397f6-062d-4f82-bcd6-3ae86c3b2c4f', 'JK6G', '2027-09-11', 0, 875);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('4f3b9a27-f420-48b3-9ca2-58a718499539', 'd0b397f6-062d-4f82-bcd6-3ae86c3b2c4f', 'PG4D', '2027-11-11', 48, 875);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('5dd4c3bc-cc30-43a8-8acc-6b2ba8633a48', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001296', '8936106320679', 'Enalapril Stella 10mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('5855c205-9363-42f4-bf80-c59074f13126', '5dd4c3bc-cc30-43a8-8acc-6b2ba8633a48', 'Viên', 1, true, 960, 1300);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('fb2404d1-7ef2-4be0-ad32-2fdd7ac9c322', '5dd4c3bc-cc30-43a8-8acc-6b2ba8633a48', '010325', '2028-03-02', 120, 960);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('6d57923d-0b69-4d88-b937-98c28fc63508', '5dd4c3bc-cc30-43a8-8acc-6b2ba8633a48', '200925', '2028-09-29', 200, 960);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('2db0be6d-47a5-4090-8b59-f556c58fa37e', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001293', NULL, 'Furosemid 40mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('aa3656e7-477c-4e27-8dc4-17b3fe550733', '2db0be6d-47a5-4090-8b59-f556c58fa37e', 'Viên', 1, true, 236, 400);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('de628925-3658-424a-a61f-487bdb588916', '2db0be6d-47a5-4090-8b59-f556c58fa37e', '010423', '2026-04-12', 67, 236);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d89b5975-061d-4c6f-ba81-d040f7340d59', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001287', '14012595', 'Vastarel MR 35mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('2cd7360c-a97b-4188-ac07-51bc2ffd3c2f', 'd89b5975-061d-4c6f-ba81-d040f7340d59', 'Viên', 1, true, 3000, 3100);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('0f835091-a0a4-4054-b21e-f7094f3d79ed', 'd89b5975-061d-4c6f-ba81-d040f7340d59', '6107766', '2027-07-07', 0, 3000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('eb0e22be-4360-497b-a7eb-3c44cc1ac53f', 'd89b5975-061d-4c6f-ba81-d040f7340d59', '6117191', '2028-02-01', 0, 3000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('a1b2b019-b172-4e3f-8048-a23545133033', 'd89b5975-061d-4c6f-ba81-d040f7340d59', '6117195', '2028-02-01', 60, 3000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('a2ff420d-89f6-4507-8391-c483b016c6dd', 'd89b5975-061d-4c6f-ba81-d040f7340d59', '6119648', '2028-03-01', 120, 3000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('425e4233-b8b0-42dd-8ffd-81104ee5c634', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001284', '8935206007831', 'Apitim 5', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('3b24f2ec-0925-4fab-bd61-2dc2ece21827', '425e4233-b8b0-42dd-8ffd-81104ee5c634', 'Viên', 1, true, 737, 800);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('24c3ddd2-e957-4a26-9ab7-ffb6aeba612d', '425e4233-b8b0-42dd-8ffd-81104ee5c634', '150125', '2028-01-10', 0, 737);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('b0fdad35-f70a-41ef-b725-05cd550e31b5', '425e4233-b8b0-42dd-8ffd-81104ee5c634', '070825', '2028-05-17', 0, 737);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('d5e8cfc9-e9df-445e-9ff5-7d59f27a6f3e', '425e4233-b8b0-42dd-8ffd-81104ee5c634', '290925', '2028-09-28', 0, 737);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('0f3fd2dc-e32d-43fc-8e61-4ca23418c0bd', '425e4233-b8b0-42dd-8ffd-81104ee5c634', '041125', '2028-11-04', 0, 737);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('d3e17447-b94f-410b-99ab-2de3378e7cbb', '425e4233-b8b0-42dd-8ffd-81104ee5c634', '011225', '2028-12-03', 0, 737);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('c9781aaf-485f-41fa-9f29-422e2ba5f07b', '425e4233-b8b0-42dd-8ffd-81104ee5c634', '070126', '2029-01-08', 1260, 737);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('95003bfd-f9ef-4bd8-af37-d2cfa36b9b7b', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001281', '8936134272247', 'Beynit 5', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('ac9595ed-f056-48bf-af3a-afa57fee08bd', '95003bfd-f9ef-4bd8-af37-d2cfa36b9b7b', 'Viên', 1, true, 2262, 2500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('b0b1967b-6a4e-4eeb-9963-77131b589088', '95003bfd-f9ef-4bd8-af37-d2cfa36b9b7b', '010923', '2026-09-15', 30, 2262);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('3eff32a7-6778-4142-8a7c-8c45b4444b5e', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001275', '8936004136013', 'DigoxineQualy', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('8115a40f-7db3-4a03-987d-fbd0c9298596', '3eff32a7-6778-4142-8a7c-8c45b4444b5e', 'Viên', 1, true, 713, 1000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('2c0fd1aa-ef5f-475a-a354-7e4548c51f89', '3eff32a7-6778-4142-8a7c-8c45b4444b5e', '0', '2028-04-08', 95, 713);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('31b523ba-9832-4ab1-9ebb-d86c08d1e633', '3eff32a7-6778-4142-8a7c-8c45b4444b5e', '000225', '2028-04-08', 0, 713);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('b70fe559-8607-49b5-8e84-3022742ecb08', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001273', '14014509', 'Coversyl 5mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('c96ce820-9a51-4834-8287-b22da8da963e', 'b70fe559-8607-49b5-8e84-3022742ecb08', 'Viên', 1, true, 6800, 7000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('a91de304-5706-4f3d-95db-c083c1900fd3', 'b70fe559-8607-49b5-8e84-3022742ecb08', '8947', '2027-07-07', 0, 6800);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('272eb2b6-1372-444b-8261-a6d850019313', 'b70fe559-8607-49b5-8e84-3022742ecb08', '6560', '2027-10-01', 30, 6800);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('3974f990-25b1-4000-8c97-0a1e19b884c5', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001270', NULL, 'Concor Cor 2.5mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('95996e22-6911-4f3d-a524-a7d0d2c203bd', '3974f990-25b1-4000-8c97-0a1e19b884c5', 'Viên', 1, true, 3230, 3500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('b792b9b3-d237-4cd8-bcea-677a37715033', '3974f990-25b1-4000-8c97-0a1e19b884c5', '60101', '2027-01-09', 0, 3230);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('2cd96672-1be1-49e8-9b29-e891fa96b480', '3974f990-25b1-4000-8c97-0a1e19b884c5', '4235C60100', '2027-03-27', 20, 3230);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('fed6f22e-63dd-48ff-ba42-e377c67add06', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001264', '8936061371099', 'Migomik', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('dd857417-710b-4035-a0b7-689ed25c3d17', 'fed6f22e-63dd-48ff-ba42-e377c67add06', 'Viên', 1, true, 2100, 2500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('9ffd1dbd-ced6-4b5d-877f-7593f7819e2a', 'fed6f22e-63dd-48ff-ba42-e377c67add06', '00124', '2027-07-01', 46, 2100);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('2a9d39b9-e510-43c5-a7da-029d298683e2', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001261', '8936024390600', 'Bihasal 2.5', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('c883ef35-b304-424e-85cd-04bfed12a66d', '2a9d39b9-e510-43c5-a7da-029d298683e2', 'Viên', 1, true, 1100, 1200);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('2343254f-e4d5-4c7d-850e-e5502d5db688', '2a9d39b9-e510-43c5-a7da-029d298683e2', '00624', '2027-11-09', 0, 1100);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('f27452ec-ae0f-430c-a44f-9fdb6f333313', '2a9d39b9-e510-43c5-a7da-029d298683e2', '00525', '2028-08-26', 579, 1100);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('bf69054f-a4db-4ccb-ae1f-9dddd3d0b5fa', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001255', '8936106320723', 'Nifedipin T20 Stella', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('e43e6e47-8e63-4811-a580-c32252b87476', 'bf69054f-a4db-4ccb-ae1f-9dddd3d0b5fa', 'Viên', 1, true, 661, 700);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('fff1abcb-b68e-4a3f-a4b5-f578655b1845', 'bf69054f-a4db-4ccb-ae1f-9dddd3d0b5fa', '050225', '2029-02-16', 0, 661);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('9c9bed2f-a9db-4170-9bd0-815215905385', 'bf69054f-a4db-4ccb-ae1f-9dddd3d0b5fa', '290925', '2029-09-17', 0, 661);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('65ca2c48-bd38-4aa5-92a8-558c23447da7', 'bf69054f-a4db-4ccb-ae1f-9dddd3d0b5fa', '361225', '2029-12-17', 539, 661);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('716d9cb5-f049-4a0a-a3ef-f255fb2d1105', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001252', '14010769', 'Daflon 500mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('74f74c06-77a4-4f6e-9bf3-eff6f82488ec', '716d9cb5-f049-4a0a-a3ef-f255fb2d1105', 'Viên', 1, true, 4500, 4800);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('0f11ffb8-7eca-4591-a25c-816923a0124e', '716d9cb5-f049-4a0a-a3ef-f255fb2d1105', '6104037', '2028-06-06', 0, 4500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('fb0faa94-90c0-4a01-bff8-d1cc6a506519', '716d9cb5-f049-4a0a-a3ef-f255fb2d1105', '6121591', '2029-04-01', 0, 4500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('40d5c202-8109-4022-9444-2a00398ca4df', '716d9cb5-f049-4a0a-a3ef-f255fb2d1105', '6121976', '2029-04-01', 340, 4500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('eb2bea22-d132-407a-bb2a-ac67f08dd9e5', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001246', NULL, 'Hyzaar 50mg/12.5mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('d8d0e3e0-d277-4148-bcc0-7df7ef0058fa', 'eb2bea22-d132-407a-bb2a-ac67f08dd9e5', 'Viên', 1, true, 8300, 8900);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('f0c9dcd2-893a-441c-9ff1-14c338a41ac5', 'eb2bea22-d132-407a-bb2a-ac67f08dd9e5', '4673', '2026-10-22', 0, 8300);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('761416f0-b553-41dc-bb7e-a0daad92b16d', 'eb2bea22-d132-407a-bb2a-ac67f08dd9e5', 'D137470', '2028-01-19', 56, 8300);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('3a328901-4f95-472e-be2e-780e1ff35731', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001243', '8936134270663', 'Telzid 40/12.5', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('7648e911-b11d-4064-b767-616b35e9d7c4', '3a328901-4f95-472e-be2e-780e1ff35731', 'Viên', 1, true, 10600, 1500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('8fd88d92-2846-437d-a9e1-d81a9d133359', '3a328901-4f95-472e-be2e-780e1ff35731', '020325', '2028-03-07', 0, 10600);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('900b8ab7-418c-4b59-9046-01407c73b3f8', '3a328901-4f95-472e-be2e-780e1ff35731', '011125', '2028-11-01', 500, 10600);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('de25d1a5-fe17-4dbe-88f4-ccbb95fc4282', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001240', '8936022470687', 'COMBIZAR', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('8d0118a2-9031-4f3f-9045-6d157d7ed18d', 'de25d1a5-fe17-4dbe-88f4-ccbb95fc4282', 'Viên', 1, true, 0, 2830);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('4ba35220-5305-45e9-900c-535709cb4a1f', 'de25d1a5-fe17-4dbe-88f4-ccbb95fc4282', '419811', '2026-10-28', 150, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('06ff8641-4d89-4b79-932f-4640999b084d', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001237', '8936061372171', 'Vecarzec 5', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('68056bb9-0cfe-450c-8c0f-ea1855bb7e5f', '06ff8641-4d89-4b79-932f-4640999b084d', 'Viên', 1, true, 0, 6000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('79fa6700-7718-4d62-9f8e-8480a8cca08f', '06ff8641-4d89-4b79-932f-4640999b084d', '00124', '2027-02-16', 0, 0);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('f9f78fd5-4095-4efc-910f-cf892bc59447', '06ff8641-4d89-4b79-932f-4640999b084d', '00125', '2028-04-09', 214, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('a3e0b798-f897-4ecb-a18a-4aa6d2aeffa5', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001234', '8936106320181', 'Felodipine Stella 5mg retard', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('86b548fe-a272-414b-a917-9cde43e918ff', 'a3e0b798-f897-4ecb-a18a-4aa6d2aeffa5', 'Viên', 1, true, 1455, 1700);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('712a22a1-574f-447c-8649-a455f322b436', 'a3e0b798-f897-4ecb-a18a-4aa6d2aeffa5', '180325', '2028-03-01', 0, 1455);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('b250fc71-925c-4dec-b2cd-b37df2040663', 'a3e0b798-f897-4ecb-a18a-4aa6d2aeffa5', '0', '2028-08-04', 0, 1455);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('d6c39545-4d31-4240-bfb9-9b3edc113e1b', 'a3e0b798-f897-4ecb-a18a-4aa6d2aeffa5', '741025', '2028-10-24', 10, 1455);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('989a0a06-a3ee-4ef2-a90f-90d8668fad8b', 'a3e0b798-f897-4ecb-a18a-4aa6d2aeffa5', '961225', '2028-12-08', 500, 1455);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('62d8eaa5-18f5-4b16-95f1-f84755fd6c35', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001228', '8936024391478', 'Imidu 60 mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('95d0e003-f24f-4fb5-b172-e99b1b9efb6a', '62d8eaa5-18f5-4b16-95f1-f84755fd6c35', 'Viên', 1, true, 2410, 2500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('27d5ee2d-9521-4a02-aaae-0a9938b26ae6', '62d8eaa5-18f5-4b16-95f1-f84755fd6c35', '01324', '2029-10-11', 70, 2410);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('83c69baf-4d24-4ec6-96f8-343a191a0458', '62d8eaa5-18f5-4b16-95f1-f84755fd6c35', '0', '2030-05-10', 150, 2410);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('811fc7e0-4e5c-43a0-83a7-ad514d0f0a4f', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001222', '8936106320594', 'Captopril stella 25mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('f7f9dc0a-4584-4de9-923b-3fc4a6c839b0', '811fc7e0-4e5c-43a0-83a7-ad514d0f0a4f', 'Viên', 1, true, 550, 600);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('19ce6026-a3aa-4b2b-ad9b-706c20fb2f58', '811fc7e0-4e5c-43a0-83a7-ad514d0f0a4f', '270924', '2027-09-28', 0, 550);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('adcf24ca-e45b-4d25-acc7-f4da429ac9fb', '811fc7e0-4e5c-43a0-83a7-ad514d0f0a4f', '300925', '2028-09-06', 250, 550);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('9b46ce44-90d7-4d7d-865a-8c650064560f', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001219', '8934618001727', 'Dopolys', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('c4b5c6c1-ae66-4ea9-a48f-beb6dfe33715', '9b46ce44-90d7-4d7d-865a-8c650064560f', 'Viên', 1, true, 2780, 4000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('8e201ed3-91a0-4663-ac1d-08927c150af0', '9b46ce44-90d7-4d7d-865a-8c650064560f', '02524', '2027-12-26', 180, 2780);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('81396630-a819-4fd3-afe0-34c3b23db41c', '9b46ce44-90d7-4d7d-865a-8c650064560f', '01225', '2028-03-20', 90, 2780);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('facc9055-fddf-4b16-864c-6509fff2f6d3', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001216', '8936024394783', 'Vashasan MR 35mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('1849b3d2-5476-4c9f-be80-cc39e3a9527f', 'facc9055-fddf-4b16-864c-6509fff2f6d3', 'Viên', 1, true, 1147, 1300);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('19ab8fac-b06f-4be8-98e4-278d8d02de22', 'facc9055-fddf-4b16-864c-6509fff2f6d3', '00324', '2027-12-16', 0, 1147);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('a056d98a-a3c0-4d85-9677-e857b5aefb28', 'facc9055-fddf-4b16-864c-6509fff2f6d3', '090825', '2028-07-16', 0, 1147);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('82ec45c6-94ab-473f-8a0c-636fd443150a', 'facc9055-fddf-4b16-864c-6509fff2f6d3', '02025', '2028-11-08', 670, 1147);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('e303e95f-31d6-4ba7-813f-e0c065e218bf', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001213', '8936106320761', 'Lostad T50', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('fbfb9629-e74e-411e-8664-40fbf095c618', 'e303e95f-31d6-4ba7-813f-e0c065e218bf', 'Viên', 1, true, 2243, 2600);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('cc5f7233-3657-458f-ac2a-a41e1cf240d2', 'e303e95f-31d6-4ba7-813f-e0c065e218bf', '010125', '2028-01-21', 34, 2243);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('39a98786-7cc1-4ed2-aa26-a512285cf24a', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001210', '8936029641622', 'Vataseren', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('50f5d5a1-0b5e-47b9-b7e3-f67f55829c6c', '39a98786-7cc1-4ed2-aa26-a512285cf24a', 'Viên', 1, true, 273, 330);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('b5e49881-64e0-4eb4-819c-2169bfa6f365', '39a98786-7cc1-4ed2-aa26-a512285cf24a', '010524', '2027-05-26', 0, 273);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('b1f26d3b-1c5a-4340-b79e-a85b281a80b4', '39a98786-7cc1-4ed2-aa26-a512285cf24a', '1224', '2027-12-17', 0, 273);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('0560553f-d084-4ad7-80be-f32358f1a138', '39a98786-7cc1-4ed2-aa26-a512285cf24a', '010825', '2028-08-03', 2150, 273);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('41b526c0-3ad7-439a-9365-15a8679d0d33', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001208', NULL, 'Coveram 5mg/5mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('1e81fa47-a2ea-404b-8a0e-09aacf6211f0', '41b526c0-3ad7-439a-9365-15a8679d0d33', 'Viên', 1, true, 8347, 9000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('a0d41cf1-dac9-48ce-94ab-7e712075433d', '41b526c0-3ad7-439a-9365-15a8679d0d33', '80701', '2027-07-07', 0, 8347);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('adeaae6d-67c0-46dc-bcec-2781edfa0eea', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001205', '8936024394264', 'Nifedipin Hasan 20 Retard', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('eb7219d5-d840-4841-85f7-36e03eeca466', 'adeaae6d-67c0-46dc-bcec-2781edfa0eea', 'Viên', 1, true, 540, 600);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('178ea19a-c833-446c-9fe0-15a6929c9904', 'adeaae6d-67c0-46dc-bcec-2781edfa0eea', '00625', '2028-03-09', 0, 540);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('53d6c9b5-2a62-475f-b3c8-2f7d16b33583', 'adeaae6d-67c0-46dc-bcec-2781edfa0eea', '01225', '2028-05-24', 0, 540);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('f92d3496-c4b9-4b57-a47b-383a06633dc2', 'adeaae6d-67c0-46dc-bcec-2781edfa0eea', '01325', '2028-07-06', 0, 540);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('b43141e3-eb5d-48f3-82ef-b82923b1ec5d', 'adeaae6d-67c0-46dc-bcec-2781edfa0eea', '0', '2028-07-09', 0, 540);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('9b2c4a4e-8ac9-4c15-a3d7-c94ceb535c79', 'adeaae6d-67c0-46dc-bcec-2781edfa0eea', '02225', '2028-11-27', 880, 540);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('1bf10fb9-fe27-44f1-990d-8b8b5a2a2bd6', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001202', '8901120160976', 'Amlodac 5mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('3ed217a7-ad34-4cf4-bded-5b94f4dc37ed', '1bf10fb9-fe27-44f1-990d-8b8b5a2a2bd6', 'Viên', 1, true, 270, 400);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('897a1213-4763-4583-a271-ca6595b736c7', '1bf10fb9-fe27-44f1-990d-8b8b5a2a2bd6', 'g400915', '2027-04-04', 0, 270);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('628138c7-8f89-4338-8631-86633febedec', '1bf10fb9-fe27-44f1-990d-8b8b5a2a2bd6', 'G500647', '2028-03-19', 0, 270);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('d6accf64-6538-4014-828d-4df4e0b3f95f', '1bf10fb9-fe27-44f1-990d-8b8b5a2a2bd6', 'GA0160A', '2028-05-04', 560, 270);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('ea70e494-4927-4660-8a3d-4d7f65184b97', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001199', NULL, 'Perimirane 10mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('234be902-57ef-42d0-8610-12c2265f77ab', 'ea70e494-4927-4660-8a3d-4d7f65184b97', 'Viên', 1, true, 328, 750);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('dcfe3ca3-20f3-4235-82f5-f660a82bdd96', 'ea70e494-4927-4660-8a3d-4d7f65184b97', '020524', '2027-05-26', 98, 328);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('c553138f-987a-436a-9410-36f05e2c31d6', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001197', NULL, 'Coversyl Plus 5mg/1.25mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('9c049e2a-3890-4de8-94aa-7c5b25669aa5', 'c553138f-987a-436a-9410-36f05e2c31d6', 'Viên', 1, true, 8183, 8500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('98612488-853b-441c-8de9-b73fa08f9df1', 'c553138f-987a-436a-9410-36f05e2c31d6', '0', '2027-07-01', 27, 8183);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('07650115-82af-4372-87f6-716603e91424', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001194', '8936134270793', 'Telzid 80/12.5', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('eff27343-4c21-4c49-aa99-c4cbc52ec941', '07650115-82af-4372-87f6-716603e91424', 'Viên', 1, true, 2055, 2500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('34cc25d7-9462-4c68-ae0b-5fc1010c3b81', '07650115-82af-4372-87f6-716603e91424', '031224', '2027-12-01', 0, 2055);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('f2eba340-9f7d-48cb-ac08-85c7b69c4e81', '07650115-82af-4372-87f6-716603e91424', '011125', '2028-11-03', 0, 2055);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('d81f12d9-2367-439e-ab0f-484ba2e1c3b4', '07650115-82af-4372-87f6-716603e91424', '131125', '2028-11-12', 420, 2055);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('87d978e9-d8e6-4170-9587-9849d0d3cfbc', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001191', '8934690110881', 'Ambidil 5mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('7487d83b-f0f5-4e1c-8bd3-5b5f74f1f552', '87d978e9-d8e6-4170-9587-9849d0d3cfbc', 'Viên', 1, true, 550, 700);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('ee58424a-4228-479f-93b2-7cca5e4d408a', '87d978e9-d8e6-4170-9587-9849d0d3cfbc', '25002', '2028-04-01', 0, 550);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('16ebac50-e754-4f88-a2d9-7a7e9f203419', '87d978e9-d8e6-4170-9587-9849d0d3cfbc', '25004', '2028-10-05', 0, 550);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('215d1aa9-1e94-4ed0-b132-0fee8fa9b112', '87d978e9-d8e6-4170-9587-9849d0d3cfbc', '26001', '2029-01-16', 600, 550);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('38054ecb-3861-4072-ab8d-25c64bfc51c9', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001188', NULL, 'Meyerflavo', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('7a878577-cdcc-40f1-8235-62ded9eebee7', '38054ecb-3861-4072-ab8d-25c64bfc51c9', 'Viên', 1, true, 3643, 5000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('019dc154-fc79-4dba-b5a8-51639c65cee3', '38054ecb-3861-4072-ab8d-25c64bfc51c9', '0160`', '2027-12-17', 94, 3643);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('318cf5f5-c63b-4608-9a6c-5e9e3f207886', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001182', '8936134272230', 'Beynit 2.5mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('640aea6c-99b7-48a7-ad41-fa0b02a3ea1a', '318cf5f5-c63b-4608-9a6c-5e9e3f207886', 'Viên', 1, true, 2077, 2400);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('bd9373c8-56c4-464f-aaa2-40a74c6fbf55', '318cf5f5-c63b-4608-9a6c-5e9e3f207886', '020524', '2027-05-20', 240, 2077);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('8a2ef894-7b8b-4a54-9eea-dd0899da92b8', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001176', '8936014582497', 'Atenolol Stada 50mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('da8bad3f-34a8-44da-a365-5d6344a16ff1', '8a2ef894-7b8b-4a54-9eea-dd0899da92b8', 'Viên', 1, true, 780, 1000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('52fb0a16-1659-453e-a8fa-d3030e9a5a63', '8a2ef894-7b8b-4a54-9eea-dd0899da92b8', '62024', '2027-06-12', 0, 780);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('2d6ea93e-2cd5-4ea1-a9af-22b1a4c3b2fd', '8a2ef894-7b8b-4a54-9eea-dd0899da92b8', '02122024', '2027-12-20', 150, 780);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('90569a93-435b-4ad0-a8fd-0f562898e9d1', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001174', NULL, 'Eszonox 2mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('95db6056-93f9-46c7-8320-b6e14cc5a48a', '90569a93-435b-4ad0-a8fd-0f562898e9d1', 'Viên', 1, true, 850, 2000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('082a4191-f356-4154-9e46-ad041b228394', '90569a93-435b-4ad0-a8fd-0f562898e9d1', '0', '2027-10-29', 10, 850);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('01f76532-e3da-42a9-8cf9-90ab275c59ed', '90569a93-435b-4ad0-a8fd-0f562898e9d1', '7261024', '2027-10-29', 0, 850);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('7dedabd7-2c8e-4f12-a7f9-b50484b08fcf', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001171', '8936024390792', 'Bihasal 5mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('1ab8273e-e915-4f36-8afe-d3e6213dd6a6', '7dedabd7-2c8e-4f12-a7f9-b50484b08fcf', 'Viên', 1, true, 1414, 1600);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('73d50f5a-5a32-408d-a57a-44a75c9f9f21', '7dedabd7-2c8e-4f12-a7f9-b50484b08fcf', '00125', '2028-01-22', 0, 1414);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('73ea8eec-6309-44b9-981b-53bfb31bafa0', '7dedabd7-2c8e-4f12-a7f9-b50484b08fcf', '090825', '2028-04-22', 0, 1414);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('bbd6189e-446b-43bf-bb47-6f9ed4e5e950', '7dedabd7-2c8e-4f12-a7f9-b50484b08fcf', '00625', '2028-12-27', 10, 1414);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('49703e1e-25c2-4766-bf00-2e3890611aa0', '7dedabd7-2c8e-4f12-a7f9-b50484b08fcf', '00126', '2029-02-23', 100, 1414);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('02dc47dc-e5d4-4a5d-8eb3-301f16c9c824', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001165', NULL, 'Aescin 20mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('e37c4a08-3169-4854-911b-37c67001894c', '02dc47dc-e5d4-4a5d-8eb3-301f16c9c824', 'Viên', 1, true, 1681, 2000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('fc036ac2-b9cd-4861-ab5f-b5ae1a33668e', '02dc47dc-e5d4-4a5d-8eb3-301f16c9c824', '0', '2027-01-01', 72, 1681);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('cb530c20-cf13-4699-a7a4-ab9a03ffeb96', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001162', '8936106324592', 'Enalapril Stella 5mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('9bcb7fe4-ade9-426e-9870-920764d954ae', 'cb530c20-cf13-4699-a7a4-ab9a03ffeb96', 'Viên', 1, true, 727, 900);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('6d8d802a-f976-473f-b111-90c4f0b7f5b6', 'cb530c20-cf13-4699-a7a4-ab9a03ffeb96', '050525', '2028-05-13', 0, 727);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('0d654e14-3c48-4a2b-a6ee-27dcfea25b26', 'cb530c20-cf13-4699-a7a4-ab9a03ffeb96', '0', '2028-07-12', 370, 727);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('3c2af558-f2d6-494b-aa47-0531096c933e', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001159', '8936014583913', 'Daflavon', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('124f2e62-e9c5-4aa1-b872-3a6494cb7fbb', '3c2af558-f2d6-494b-aa47-0531096c933e', 'Viên', 1, true, 1794, 2000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('fa577b07-a1e3-43d8-9a43-37def8ce6437', '3c2af558-f2d6-494b-aa47-0531096c933e', '340924', '2027-09-16', 0, 1794);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('65787fec-3e71-4215-b1ad-987849dbda5c', '3c2af558-f2d6-494b-aa47-0531096c933e', '380924', '2027-09-17', 0, 1794);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('58204016-4d88-4ec2-8957-43ec3d441218', '3c2af558-f2d6-494b-aa47-0531096c933e', '100425', '2028-04-22', 311, 1794);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('5ebf2bff-a4b5-4d2b-9b28-874239810cc2', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001153', '99029623', 'Exforge 5/80mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('16bea1df-3f09-48e3-9cc4-a505a05a1372', '5ebf2bff-a4b5-4d2b-9b28-874239810cc2', 'Viên', 1, true, 10500, 11000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('823003c5-8663-433c-9c7b-d73345dd73af', '5ebf2bff-a4b5-4d2b-9b28-874239810cc2', 'B8949A', '2026-04-04', 0, 10500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('dfe2475b-f087-4698-bd04-55125b6a7564', '5ebf2bff-a4b5-4d2b-9b28-874239810cc2', '9559j', '2028-04-30', 28, 10500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('a7d724a5-7a34-480f-a9d2-51c876d4ea77', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001150', '8936106320907', 'Lostad HCT 50/12,5mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('2d1b128b-0e3a-42ef-b4f1-f181b37042bf', 'a7d724a5-7a34-480f-a9d2-51c876d4ea77', 'Viên', 1, true, 2563, 2700);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('25235ffc-5adf-4f10-b0c2-cc476c284c41', 'a7d724a5-7a34-480f-a9d2-51c876d4ea77', '010324', '2027-03-18', 10, 2563);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('847dbdc1-eeb9-4d5b-8fb2-b35ba5d3b06e', 'a7d724a5-7a34-480f-a9d2-51c876d4ea77', '091125', '2028-11-25', 150, 2563);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('5f2b0a3c-54a6-469d-b32f-c45f1e83fd29', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001147', '8934690010945', 'Atorlog 20mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('43f28b11-25bf-47c7-854e-6f69e8d71754', '5f2b0a3c-54a6-469d-b32f-c45f1e83fd29', 'Viên', 1, true, 1333, 2000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('8e346731-289b-452b-a61e-96322c031f73', '5f2b0a3c-54a6-469d-b32f-c45f1e83fd29', '24005', '2026-12-24', 0, 1333);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('6fa87083-d575-44a8-9f01-2a2463b78e3b', '5f2b0a3c-54a6-469d-b32f-c45f1e83fd29', '0', '2027-03-21', 0, 1333);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('af86697a-5515-4998-b9f5-411f552a7b0f', '5f2b0a3c-54a6-469d-b32f-c45f1e83fd29', '25002', '2027-11-01', 330, 1333);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('5054400c-b30a-4cf4-bbaf-307a2346dc7c', '1fdb2de8-78f6-45ef-82db-35677936ff2c', 'SP000001', NULL, 'Strepsils cool (Gói)', true, '9e952bb5-672f-4d27-852c-d35301f45023', 'cool (Gói)');
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('5000a653-9d9e-4011-8ecd-e1d41d130544', '5054400c-b30a-4cf4-bbaf-307a2346dc7c', 'Gói', 1, true, 3520, 5000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('f52dd1f6-05b9-4080-a418-1d01e66e56d1', '5054400c-b30a-4cf4-bbaf-307a2346dc7c', 'ABG1913', '2028-03-06', 0, 3520);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('c44ade67-4de5-4c3e-933f-b411889f0161', '5054400c-b30a-4cf4-bbaf-307a2346dc7c', '922', '2028-07-21', 193, 3520);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('a389f58c-e617-4364-911d-c212ffaa275f', '5054400c-b30a-4cf4-bbaf-307a2346dc7c', '442', '2028-08-19', 0, 3520);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('08d308f2-4328-40d8-9fb7-d1f85bfedb9c', '1fdb2de8-78f6-45ef-82db-35677936ff2c', 'SP001144', NULL, 'Strepsils Original', true, '9e952bb5-672f-4d27-852c-d35301f45023', 'Original');
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('8d594225-acef-4c11-ad6d-024f5c885f74', '08d308f2-4328-40d8-9fb7-d1f85bfedb9c', 'Gói', 1, true, 3520, 5000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                VALUES ('8d382170-4825-4ef4-918c-724bd26c0caa', '08d308f2-4328-40d8-9fb7-d1f85bfedb9c', 'LO-MACDINH', '2099-12-31', 145, 3520);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('fcfeed32-84d7-409f-9404-322cb787d277', '1fdb2de8-78f6-45ef-82db-35677936ff2c', 'SP001143', '96118511', 'Kẹo con tàu', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('54560c59-08da-400e-946a-d94ebec6e0ff', 'fcfeed32-84d7-409f-9404-322cb787d277', 'Gói', 1, true, 20000, 23000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('329a18aa-673f-4a06-8a80-7270dfa1379e', 'fcfeed32-84d7-409f-9404-322cb787d277', '0', '2027-10-23', 0, 20000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('0554dd0d-72e0-478e-92cb-fc2e63ebe4f1', 'fcfeed32-84d7-409f-9404-322cb787d277', '0', '2028-11-20', 37, 20000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('7e58bbd4-5b71-46e9-84e1-acdfa3623d10', 'fcfeed32-84d7-409f-9404-322cb787d277', '0011', '2029-01-04', 0, 20000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('6aff003e-9b9d-4aa7-a266-b2928e3ea4de', '1fdb2de8-78f6-45ef-82db-35677936ff2c', 'SP001142', '9555030108581', 'kẹo chanh muối Himalaya', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('39fa81a9-c4cd-4356-aca1-ad50f538101f', '6aff003e-9b9d-4aa7-a266-b2928e3ea4de', 'Gói', 1, true, 7483.3, 8000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('31f0c532-4664-4494-9cfc-1a87ed99307e', '6aff003e-9b9d-4aa7-a266-b2928e3ea4de', '0', '2027-02-09', 0, 7483.3);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('46621411-d909-45ce-a7c5-bbd8eedbb6b3', '6aff003e-9b9d-4aa7-a266-b2928e3ea4de', '25h14', '2027-08-04', 0, 7483.3);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('257a4b56-e2f4-492e-a9e8-3845deb1a60b', '6aff003e-9b9d-4aa7-a266-b2928e3ea4de', '25H21', '2027-08-19', 54, 7483.3);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('79648b73-37d7-4580-9545-c1438286b75a', '1fdb2de8-78f6-45ef-82db-35677936ff2c', 'SP001139', '9556108211349', 'Strepsils cool', true, '9e952bb5-672f-4d27-852c-d35301f45023', 'cool');
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('3527933e-6d1f-4812-b7f3-eee2d9fb916b', '79648b73-37d7-4580-9545-c1438286b75a', 'Viên', 1, true, 1416, 1666);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('8e1b2d15-b4e0-401b-a16a-1a48e4d98a55', '79648b73-37d7-4580-9545-c1438286b75a', 'ABG3496', '2028-04-29', 0, 1416);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('69267fef-3b3b-4502-adb6-f00b84fc6374', '79648b73-37d7-4580-9545-c1438286b75a', 'ABH3271', '2028-09-23', 132, 1416);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('2a60bfda-577d-4a59-a1b9-19941bea1837', '1fdb2de8-78f6-45ef-82db-35677936ff2c', 'SP001137', '9556108211356', 'Strepsils cam Vitamin C', true, '9e952bb5-672f-4d27-852c-d35301f45023', 'cam Vitamin C');
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('5349c336-9d74-436b-83ed-d4dde0128354', '2a60bfda-577d-4a59-a1b9-19941bea1837', 'Viên', 1, true, 1416, 1666);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('4ae7215c-e340-405b-bb40-4de993302a4b', '2a60bfda-577d-4a59-a1b9-19941bea1837', 'ABG3497', '2028-05-01', 0, 1416);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('e42bf8d1-7272-4f0e-a1a1-ad2b3aa101bb', '2a60bfda-577d-4a59-a1b9-19941bea1837', 'ABH1719', '2028-08-26', 0, 1416);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('47cb948b-26e1-4e0c-8425-4fcbb3d6e27b', '2a60bfda-577d-4a59-a1b9-19941bea1837', 'ABH9830', '2029-01-17', 156, 1416);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('f2e55360-ebac-4274-8545-1cdf03797492', '1fdb2de8-78f6-45ef-82db-35677936ff2c', 'SP001135', '9556108211325', 'Strepsils Original vỉ', true, '9e952bb5-672f-4d27-852c-d35301f45023', 'Original vỉ');
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('4843c28e-62c8-4647-8314-1d3f94f5f228', 'f2e55360-ebac-4274-8545-1cdf03797492', 'Viên', 1, true, 1416, 1666);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('2991c272-7c97-4cf5-86a5-6eacb6c48ed5', 'f2e55360-ebac-4274-8545-1cdf03797492', 'ABG9635', '2027-07-09', 0, 1416);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('03212384-dd04-4774-ba8e-3bb010b31c81', 'f2e55360-ebac-4274-8545-1cdf03797492', 'ABH1718', '2028-08-22', 0, 1416);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('17a33d0e-de5e-41b7-b8fe-2cb69cdb071b', 'f2e55360-ebac-4274-8545-1cdf03797492', 'ABH8269', '2028-12-20', 48, 1416);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('a61b2a2b-0f2a-49e8-9e89-a1ec199ebd17', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP001134', NULL, 'Otiv h/60v', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('3fcf47cc-d146-4a52-a1bb-30165f5ab581', 'a61b2a2b-0f2a-49e8-9e89-a1ec199ebd17', 'Lọ', 1, true, 510000, 590000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('4ab43e0b-211f-46ca-8c6d-90094ebce0f2', 'a61b2a2b-0f2a-49e8-9e89-a1ec199ebd17', '0', '2027-01-01', 1, 510000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('76b5b643-8cf9-41c2-b139-20de0e499866', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP001133', NULL, 'Otiv 30V', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('69ddcd4f-027e-4b62-86b6-67f88c5eb961', '76b5b643-8cf9-41c2-b139-20de0e499866', 'Lọ', 1, true, 290000, 330000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('ce832d23-1b56-4989-bcd0-007f13eb8d6f', '76b5b643-8cf9-41c2-b139-20de0e499866', '0', '2027-11-14', 1, 290000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('e2465d27-ea56-442b-9cfa-5c833449fc6c', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP001132', NULL, 'Jex 60V', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('0b47f2e5-e5f7-4494-8a1b-d9f54b83b11e', 'e2465d27-ea56-442b-9cfa-5c833449fc6c', 'Lọ', 1, true, 609000, 630000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('e14372c4-95ac-40b3-82be-4bf56ed21227', 'e2465d27-ea56-442b-9cfa-5c833449fc6c', 'JP41062460', '2027-05-22', 0, 609000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('e723775a-78c6-498d-a6a9-7a4631dffe6c', 'e2465d27-ea56-442b-9cfa-5c833449fc6c', 'JP4311', '2027-12-01', 0, 609000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('21d38b67-49c5-4110-9639-fa88e6ba68e4', 'e2465d27-ea56-442b-9cfa-5c833449fc6c', '0', '2027-12-29', 0, 609000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('494e5269-807e-402f-9fef-91c50c2eea7c', '598c238d-2790-45c2-be55-d1723fdf1179', 'SP001131', '8850007811251', 'Listerine -coolmint 750ml', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('56d7ac78-6141-45ce-ad71-b000821c3383', '494e5269-807e-402f-9fef-91c50c2eea7c', 'Chai', 1, true, 77000, 85000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('56870c99-7caa-4a76-8029-b3cc15ab8d3a', '494e5269-807e-402f-9fef-91c50c2eea7c', '0', '2028-01-01', 0, 77000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('86efcdec-4cef-4c3d-b865-559d28e13eff', '494e5269-807e-402f-9fef-91c50c2eea7c', '5C328G', '2028-11-21', 0, 77000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('ec343276-ef98-4bc7-b911-a24baedb3cf5', '494e5269-807e-402f-9fef-91c50c2eea7c', '6C048G', '2029-02-15', 5, 77000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('909796fe-b36c-4c4e-9bcb-c640383747b1', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP001129', '8851401002030', 'Băng cá nhân Urgo trong', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('910639f2-b287-4076-9c3b-d082898b3618', '909796fe-b36c-4c4e-9bcb-c640383747b1', 'Miếng', 1, true, 550, 750);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('272d3385-800f-491a-998a-898e839c7412', '909796fe-b36c-4c4e-9bcb-c640383747b1', '0', '2028-01-01', 0, 550);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('ec6cee72-b62e-43ee-bc46-fcd5a3d929e8', '909796fe-b36c-4c4e-9bcb-c640383747b1', '24087', '2029-08-31', 402, 550);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('ccb2575c-9e92-45f4-8ce6-11fd6438f1f6', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP001126', '8858419006135', 'Băng cá nhân đỏ', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('70a0fee8-c04c-4099-bbfc-e41e1ed72853', 'ccb2575c-9e92-45f4-8ce6-11fd6438f1f6', 'Miếng', 1, true, 500, 670);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('fc4c6421-9388-4dde-b096-8b4844031126', 'ccb2575c-9e92-45f4-8ce6-11fd6438f1f6', '0', '2027-01-01', 0, 500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('3bf63b61-41c4-4c3f-9d94-e08f9805acbb', 'ccb2575c-9e92-45f4-8ce6-11fd6438f1f6', '1101', '2028-10-11', 415, 500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('6914e34c-ea88-45d2-88de-b2cdc5977548', 'ccb2575c-9e92-45f4-8ce6-11fd6438f1f6', '25121202', '2028-12-12', 1000, 500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('3800bc33-41c3-42e8-abea-caede82cf63b', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001124', NULL, 'Bozypaine', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('3ba4c83e-9c33-4c96-b57e-f533bfe1b8a9', '3800bc33-41c3-42e8-abea-caede82cf63b', 'Tuýp', 1, true, 25143, 30000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('5dfd4080-55d0-4fe9-a190-4bc629872cb7', '3800bc33-41c3-42e8-abea-caede82cf63b', '0', '2025-12-23', 0, 25143);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('3d008dd0-63d7-4583-af50-2be82cdcdfec', '3800bc33-41c3-42e8-abea-caede82cf63b', '240825', '2028-08-05', 0, 25143);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('a0c77736-cc49-4851-9803-a1a5552ab401', '3800bc33-41c3-42e8-abea-caede82cf63b', '291125', '2028-11-19', 0, 25143);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('a2eba525-736c-4490-89e9-2b68911fcb3e', '3800bc33-41c3-42e8-abea-caede82cf63b', '040126', '2029-01-19', 12, 25143);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('0273588f-5558-4661-98d2-8a03643bc662', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP001119', '8938530372484', 'Bổ Mắt Sano Eye', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('6dba200f-2ded-4da6-b442-cfbeacbc317c', '0273588f-5558-4661-98d2-8a03643bc662', 'Viên', 1, true, 3500, 5000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('7c925a52-0e2e-42ad-b053-79d31a1251b2', '0273588f-5558-4661-98d2-8a03643bc662', 'N10', '2027-06-26', 0, 3500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('388b1a0c-5ab2-4513-904d-74f599d51723', '0273588f-5558-4661-98d2-8a03643bc662', '080825', '2028-07-07', 0, 3500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('ca57d1f8-4e15-416c-82c3-f7f7d53698b8', '0273588f-5558-4661-98d2-8a03643bc662', '011225', '2028-12-12', 280, 3500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('f6a221bf-81f2-46f3-93e7-ea74deab6d56', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001114', '8936065624191', 'Tinfocool', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('59e33c2d-4a65-44d4-ad81-987b333e6abf', 'f6a221bf-81f2-46f3-93e7-ea74deab6d56', 'Gói', 1, true, 7000, 10000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('925e02b0-c2b9-4109-9aa5-8d2ff159ee6a', 'f6a221bf-81f2-46f3-93e7-ea74deab6d56', '006/23', '2026-12-29', 1, 7000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('2bb1c374-0a20-4d37-8ae7-5b6e11822f70', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001111', '8934618223051', 'Cefalexin 500mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('4d39dcdc-64ce-4f19-a16a-5c2d7170b982', '2bb1c374-0a20-4d37-8ae7-5b6e11822f70', 'Viên', 1, true, 1100, 1500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('76124285-9a12-4a23-9f96-15e91c4a683e', '2bb1c374-0a20-4d37-8ae7-5b6e11822f70', '05824', '2027-05-25', 0, 1100);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('26f938be-47d9-45d6-9181-0b9da8fad1aa', '2bb1c374-0a20-4d37-8ae7-5b6e11822f70', '08825', '2028-09-30', 0, 1100);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('35fac359-119b-4a9e-b41e-366ae5e1153b', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001108', '8935206026351', 'Mebilax 7,5mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('50467693-cafb-4b91-8656-09f327c1558e', '35fac359-119b-4a9e-b41e-366ae5e1153b', 'Viên', 1, true, 840, 1000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('d5ac2dd4-ba27-47fd-a16b-2c199cf6ccad', '35fac359-119b-4a9e-b41e-366ae5e1153b', '011224', '2027-12-14', 0, 840);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('4fd7f54f-92c0-4dd8-aa76-50558a28212d', '35fac359-119b-4a9e-b41e-366ae5e1153b', '011025', '2028-10-23', 125, 840);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('4acafb81-c279-4635-9882-c083b2acd3c0', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001105', '8935206027457', 'Zaromax 500mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('7f6e03e2-3f9b-4a0f-8c34-6057245e584f', '4acafb81-c279-4635-9882-c083b2acd3c0', 'Viên', 1, true, 4833, 5000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('fe78c405-05a4-4c68-8522-8aff4fef55bf', '4acafb81-c279-4635-9882-c083b2acd3c0', '120924', '2027-09-09', 3, 4833);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('52a27367-82c9-41e5-a1c8-e8432a81e9b2', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001102', '8936035307291', 'Azitnic 250mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('1d123038-f3e1-4378-bc52-6f432087b0c4', '52a27367-82c9-41e5-a1c8-e8432a81e9b2', 'Viên', 1, true, 2000, 2500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('6662a7b6-ea32-4350-84ab-447bb2eb3ee0', '52a27367-82c9-41e5-a1c8-e8432a81e9b2', '240106', '2027-01-04', 18, 2000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('20173a4a-6832-4ebc-a21d-88d8c9727094', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001099', '8934574080057', 'Amoxicillin 500mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('e7772c47-3d2d-44c2-92ca-13eb0adaa355', '20173a4a-6832-4ebc-a21d-88d8c9727094', 'Viên', 1, true, 700, 1000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('1bf4fdec-3187-4cf5-baf9-3366e0cae576', '20173a4a-6832-4ebc-a21d-88d8c9727094', '25038AN', '2027-08-28', 0, 700);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('d2d1d779-1364-4b8b-a17c-5ff918da0c83', '20173a4a-6832-4ebc-a21d-88d8c9727094', '0', '2027-12-21', 870, 700);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('8d9c9ee7-7aca-448d-aa95-459b80bf0b90', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001096', NULL, 'Alpha choay', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('89ceb53c-6a29-424d-8d07-e735cd894694', '8d9c9ee7-7aca-448d-aa95-459b80bf0b90', 'Viên', 1, true, 2173, 2350);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('8812f4f3-ef3c-4887-a831-f07cd8b5f100', '8d9c9ee7-7aca-448d-aa95-459b80bf0b90', 'FVH0260', '2027-02-19', 0, 2173);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('d82d32b2-69fe-408f-aa98-aaae9c7113e3', '8d9c9ee7-7aca-448d-aa95-459b80bf0b90', '0', '2027-06-02', 30, 2173);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('19dba0cf-b2b7-4f4f-a431-36b081c930b7', '8d9c9ee7-7aca-448d-aa95-459b80bf0b90', 'FVH2615', '2028-05-17', 150, 2173);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('7312db4d-a431-48c9-a0cc-a3a812e010b1', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001094', '8936061378500', 'Cantomy Granule 125mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('4e6ff4cb-eefb-4e53-8a93-50227c30ab90', '7312db4d-a431-48c9-a0cc-a3a812e010b1', 'Gói', 1, true, 2000, 3000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('c8ffa312-49bd-4f4e-a641-c0841aa7e977', '7312db4d-a431-48c9-a0cc-a3a812e010b1', '2324', '2027-05-20', 56, 2000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('87bca095-6ee2-46ba-b6d3-eae2b2b07c92', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001082', NULL, 'Hornol', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('4932cece-bfbe-4e8f-915f-d33a03f35658', '87bca095-6ee2-46ba-b6d3-eae2b2b07c92', 'Viên', 1, true, 3733, 4500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('78ff3f67-6f90-4043-b72b-5605f80683ce', '87bca095-6ee2-46ba-b6d3-eae2b2b07c92', '241966', '2027-07-25', 0, 3733);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('060a8e02-5c46-4828-99a3-47a24db4c439', '87bca095-6ee2-46ba-b6d3-eae2b2b07c92', '0', '2028-05-27', 44, 3733);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('988e1a38-5563-4755-84a4-5e7bf207b581', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001075', '99135041', 'Methylprednisolon 4mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('17268561-c28c-487d-8515-a3e762281925', '988e1a38-5563-4755-84a4-5e7bf207b581', 'Viên', 1, true, 305, 1000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('d474b8aa-75a0-4731-842b-766142184794', '988e1a38-5563-4755-84a4-5e7bf207b581', '4910325', '2028-03-31', 0, 305);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('880643a3-9412-4492-a191-9a8ffdbaecf3', '988e1a38-5563-4755-84a4-5e7bf207b581', '0', '2028-06-19', 0, 305);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('5f6f7626-84b4-4b3e-bba7-a8b74eca6752', '988e1a38-5563-4755-84a4-5e7bf207b581', '9731225', '2028-12-24', 966, 305);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('867ad4fb-d512-4387-a9ee-c08fea62b407', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001069', '99149345', 'Ciprofloxacin 500mg Microluss', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('14275af8-dcf3-4143-8a9c-83f501d53432', '867ad4fb-d512-4387-a9ee-c08fea62b407', 'Viên', 1, true, 890, 1000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('e0e58414-ff76-4470-aabb-a5f247540bef', '867ad4fb-d512-4387-a9ee-c08fea62b407', 'MOSH0195', '2028-01-18', 500, 890);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d799144e-8edf-47e8-b491-93d23ced7916', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001066', NULL, 'Methylprednisolon 16mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('48879379-0387-4761-870d-9070ee597d72', 'd799144e-8edf-47e8-b491-93d23ced7916', 'Viên', 1, true, 814, 2000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('7a0845a9-edd8-40a8-b9b5-d807628e3a99', 'd799144e-8edf-47e8-b491-93d23ced7916', '10120225', '2028-02-28', 0, 814);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('78215b05-96b2-444f-814a-7627bd199403', 'd799144e-8edf-47e8-b491-93d23ced7916', '0', '2028-07-25', 0, 814);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('4be5f8ce-f164-49c4-8931-6b02dfc25e4e', 'd799144e-8edf-47e8-b491-93d23ced7916', '1025', '2028-11-10', 0, 814);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('2ee589a4-d84e-440b-8c59-34cec3fdbd40', 'd799144e-8edf-47e8-b491-93d23ced7916', '8851125', '2028-11-25', 524, 814);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('2dd1a262-7db5-4195-9d35-81758a957459', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001063', '8936199490259', 'Cetirizin 10mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('f64e606f-1666-49b2-bbbc-15e56f4e3edd', '2dd1a262-7db5-4195-9d35-81758a957459', 'Viên', 1, true, 350, 500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('ace28d0d-5998-4fe4-bd90-b2ffb6060bfe', '2dd1a262-7db5-4195-9d35-81758a957459', '0', '2026-06-23', 0, 350);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('ef8fdbcb-4a18-4f46-81e4-17e60d6463cf', '2dd1a262-7db5-4195-9d35-81758a957459', '040623', '2026-06-23', 54, 350);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('fcb1edc6-f89e-4754-9c57-dd8256ba2edf', '2dd1a262-7db5-4195-9d35-81758a957459', '040825', '2028-08-07', 1000, 350);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('ea970697-3ebc-4956-ae44-6ad567fb43de', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001060', '8850769013801', 'Eugica Xanh', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('1c024d8f-444d-4256-87fb-1602ae41d117', 'ea970697-3ebc-4956-ae44-6ad567fb43de', 'Viên', 1, true, 622, 800);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('29c0c8e4-458e-4515-8425-b706600b51bc', 'ea970697-3ebc-4956-ae44-6ad567fb43de', '440924', '2026-09-25', 0, 622);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('a394753a-025e-42ac-a616-a3fffe0c97a2', 'ea970697-3ebc-4956-ae44-6ad567fb43de', '321125', '2027-11-08', 0, 622);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('1680c81b-793b-4b3a-b50f-b59a4e558700', 'ea970697-3ebc-4956-ae44-6ad567fb43de', '200126', '2028-01-20', 500, 622);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('b0233dec-155a-47d4-857a-2ce97ea447e0', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001057', '8936085360383', 'Celecoxib 200', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('525eea98-894f-40e2-821b-cf1212f18386', 'b0233dec-155a-47d4-857a-2ce97ea447e0', 'Viên', 1, true, 800, 2000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('a64eddac-6c62-42cc-bce5-4931df34bd0f', 'b0233dec-155a-47d4-857a-2ce97ea447e0', '030325', '2028-04-18', 190, 800);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('22bf3e88-1d5a-4187-8293-95dc3e80dca3', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001054', '8935076040815', 'Prednisolone 5mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('a4d25ecf-cdba-474b-958c-c786a7690d74', '22bf3e88-1d5a-4187-8293-95dc3e80dca3', 'Viên', 1, true, 150, 250);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('a96e741f-8839-4e5d-96a5-bd8301144363', '22bf3e88-1d5a-4187-8293-95dc3e80dca3', '024-060924', '2027-09-06', 0, 150);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('eb653d80-c51b-4ce6-a65e-8985758d9ef0', '22bf3e88-1d5a-4187-8293-95dc3e80dca3', '0225', '2028-02-07', 3308, 150);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('a3ef371a-9d7e-4271-8849-ba82d17a5a99', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001050', NULL, 'Ventolin XỊt', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('6b05e0de-a5b0-4873-b7c9-245201937def', 'a3ef371a-9d7e-4271-8849-ba82d17a5a99', 'Lọ', 1, true, 106000, 108000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('2054552d-0315-442d-8b34-bef6e59a5638', 'a3ef371a-9d7e-4271-8849-ba82d17a5a99', 'YE3D', '2026-06-17', 0, 106000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('eb28a3c8-2876-4de4-924a-899556a2015c', 'a3ef371a-9d7e-4271-8849-ba82d17a5a99', '0', '2026-11-05', 0, 106000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('3283ee6c-d502-4f43-b63a-bad8b7ddfac0', 'a3ef371a-9d7e-4271-8849-ba82d17a5a99', 'JK7T', '2027-05-16', 3, 106000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('45368879-d0d6-4a5f-9103-8fd102355e16', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001044', '8934700020322', 'Piropharm 20mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('21372597-db2a-4d09-a582-a224cb309e55', '45368879-d0d6-4a5f-9103-8fd102355e16', 'Viên', 1, true, 510, 700);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('9b92a2a7-e25d-4886-8db0-20929882f101', '45368879-d0d6-4a5f-9103-8fd102355e16', '214C011', '2026-07-14', 90, 510);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('911d9e2e-c096-42a3-8832-bc0c5151ac88', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001041', NULL, 'Diacerein 50mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('fab439f4-9a9c-4374-bec3-271cdb313cf5', '911d9e2e-c096-42a3-8832-bc0c5151ac88', 'Viên', 1, true, 1000, 1500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('93bd57ea-5deb-4c8a-972f-1fc782f76981', '911d9e2e-c096-42a3-8832-bc0c5151ac88', '0', '2027-11-13', 0, 1000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('81d9cd35-82c0-47b1-9aa1-e7695b08a5b2', '911d9e2e-c096-42a3-8832-bc0c5151ac88', '010125', '2028-01-13', 0, 1000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('2074b4f4-7d37-47e6-90f4-6c67694c2ac7', '911d9e2e-c096-42a3-8832-bc0c5151ac88', '070825', '2028-05-28', 0, 1000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('aa0c7261-ce68-41fe-9aed-d42bbc6715f9', '911d9e2e-c096-42a3-8832-bc0c5151ac88', '04112025', '2028-11-19', 430, 1000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('1d540ba7-5f4f-4e5a-9944-ba7f9cdcb8e1', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001038', '8936064215420', 'Baburol', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('66fccb1a-3909-4d45-94bd-8fa6ba06abad', '1d540ba7-5f4f-4e5a-9944-ba7f9cdcb8e1', 'Viên', 1, true, 800, 1100);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('ccfe4933-d522-409b-a6ea-6e132985786c', '1d540ba7-5f4f-4e5a-9944-ba7f9cdcb8e1', '030924', '2027-10-04', 0, 800);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('06fee794-d937-4450-abe8-b96425327be8', '1d540ba7-5f4f-4e5a-9944-ba7f9cdcb8e1', '0', '2028-04-14', 135, 800);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('40e7dc59-9e29-421d-8326-3a6e7f84038b', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001035', '8934690110119', 'Waisan', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('9a027339-c0fb-434e-8489-773241c27919', '40e7dc59-9e29-421d-8326-3a6e7f84038b', 'Viên', 1, true, 800, 1500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('da6ec905-5e0c-4b51-b1b0-73e74cb11547', '40e7dc59-9e29-421d-8326-3a6e7f84038b', '24034', '2027-12-16', 666, 800);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('5fd8119e-9d09-43f9-8de4-b0fe4c0d06c6', '40e7dc59-9e29-421d-8326-3a6e7f84038b', '26002', '2029-03-19', 500, 800);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('efd5a754-9cd6-4fa4-b0c0-c452a6c462ec', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001032', '8934690011577', 'Bidivon', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('8d59dbe5-b60e-4941-bf9c-f64bc58487c0', 'efd5a754-9cd6-4fa4-b0c0-c452a6c462ec', 'Viên', 1, true, 457, 600);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('9227a885-ecf0-431f-a767-2ac0cf3b1fb3', 'efd5a754-9cd6-4fa4-b0c0-c452a6c462ec', '24003', '2027-12-20', 0, 457);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('bcc166b1-43f1-4d2d-94ab-a4b680856823', 'efd5a754-9cd6-4fa4-b0c0-c452a6c462ec', '0', '2028-04-12', 210, 457);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('c04dd996-856b-49a2-b7c8-0eb7660a62b0', 'efd5a754-9cd6-4fa4-b0c0-c452a6c462ec', '26001', '2029-02-26', 1000, 457);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('8232a1c4-1aa5-4415-844a-7a918de5a945', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001026', '8936022471172', 'Alaxan', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('06c6d138-b00c-4719-9c96-a53760b82e8a', '8232a1c4-1aa5-4415-844a-7a918de5a945', 'Viên', 1, true, 1140, 1300);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('e86ef005-fd5f-4e50-887a-f28387851bde', '8232a1c4-1aa5-4415-844a-7a918de5a945', '423041', '2028-12-19', 0, 1140);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('bb024f53-6c04-41c7-a132-95e5586dc1b3', '8232a1c4-1aa5-4415-844a-7a918de5a945', '520991', '2029-12-04', 335, 1140);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('50a02ccc-1311-4944-bbab-b08835f664ab', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001023', '8902399002561', 'Meloxicam 7,5 mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('51eaad94-fae4-41b2-aa3b-8ae0a71bfd1b', '50a02ccc-1311-4944-bbab-b08835f664ab', 'Viên', 1, true, 150, 350);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('50ddcb9e-711f-4e57-a9b6-f02473e2204b', '50a02ccc-1311-4944-bbab-b08835f664ab', 'BNT0624004', '2027-05-31', 435, 150);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('f90d4c0d-3e60-4179-b40c-9535244357fa', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001019', 'PAA177600', 'Medrol 16mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('4ea456aa-c1e1-474f-aa6e-758f5ecb371c', 'f90d4c0d-3e60-4179-b40c-9535244357fa', 'Viên', 1, true, 3700, 4000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('87cb02ef-61c2-4e89-b538-767cd1aba4f8', 'f90d4c0d-3e60-4179-b40c-9535244357fa', 'LE5935', '2027-02-23', 0, 3700);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('64042c5f-6e7a-4f87-9977-aa8ae88c10e6', 'f90d4c0d-3e60-4179-b40c-9535244357fa', '070825', '2027-04-05', 29, 3700);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('5edc0fa5-2fed-40bd-8019-08ecefa964fd', 'f90d4c0d-3e60-4179-b40c-9535244357fa', '2936', '2027-05-09', 0, 3700);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('b640a857-63dd-4597-a7a0-9594ac65476a', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001016', '8850769013818', 'Eugica Fort', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('73af1153-e85e-4f16-b374-9381a65b8c66', 'b640a857-63dd-4597-a7a0-9594ac65476a', 'Viên', 1, true, 839, 900);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('2d25daf2-97e8-4a25-807f-d03dbac56960', 'b640a857-63dd-4597-a7a0-9594ac65476a', '370225', '2027-02-17', 0, 839);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('243e5b59-e22b-491a-a27f-5cbc8bb70b73', 'b640a857-63dd-4597-a7a0-9594ac65476a', '251125', '2027-11-24', 384, 839);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('932c6054-ffc3-48c1-bd93-ed557b17ff2b', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001015', NULL, 'Berodual', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('a65865cd-8ea7-452b-b300-461d696e6172', '932c6054-ffc3-48c1-bd93-ed557b17ff2b', 'Bình', 1, true, 145000, 150000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('70d87735-8f8f-4287-a4b1-6396cc7f759a', '932c6054-ffc3-48c1-bd93-ed557b17ff2b', '070825', '2026-05-23', 0, 145000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('58a8a052-2546-4f97-be8d-bc4131c164d7', '932c6054-ffc3-48c1-bd93-ed557b17ff2b', '403406C', '2026-05-23', 0, 145000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('d175ba78-f208-42d2-b6b1-327507eef52e', '932c6054-ffc3-48c1-bd93-ed557b17ff2b', '052630C', '2027-04-17', 0, 145000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('9aa16604-170e-41c2-b5ac-1cfdde6e301c', '932c6054-ffc3-48c1-bd93-ed557b17ff2b', '502630B', '2027-04-17', 0, 145000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('0a5ac117-ba7d-48e9-bfa7-4417e61ea391', '932c6054-ffc3-48c1-bd93-ed557b17ff2b', '502630C', '2027-04-17', 0, 145000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d979bc0c-7509-4103-bc94-ff0d9e11ac2c', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001013', '8902399005388', 'Cocilone 1mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('c61f33c4-75fa-469a-b901-1cce7b4a5aa6', 'd979bc0c-7509-4103-bc94-ff0d9e11ac2c', 'Viên', 1, true, 1208, 1500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('b229c488-094e-4043-9c9e-6ed1678e38d0', 'd979bc0c-7509-4103-bc94-ff0d9e11ac2c', 'BNT0124058', '2027-01-16', 95, 1208);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('99f5303b-06b5-4954-b9eb-45db7c6c2a8a', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001012', '8902399005937', 'Fimaconazole 150mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('23f6ef10-5ad4-4bd0-bb03-fba8ab2f92ce', '99f5303b-06b5-4954-b9eb-45db7c6c2a8a', 'Viên', 1, true, 4000, 10000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('11622515-c763-450a-81ab-08c3c49d1e83', '99f5303b-06b5-4954-b9eb-45db7c6c2a8a', 'BNC1024009', '2026-10-06', 0, 4000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('77651994-af4a-4daf-afce-6516d6e86369', '99f5303b-06b5-4954-b9eb-45db7c6c2a8a', '070825', '2027-03-16', 0, 4000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('55b5a987-fcaf-4386-8699-dd20eca8ae92', '99f5303b-06b5-4954-b9eb-45db7c6c2a8a', 'BNC0825001', '2027-08-01', 61, 4000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('9f2610ab-b722-4637-99af-1b0d4a8e7619', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', '00000000', '8934574082358', 'Itraconazol 100mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('9ed5e7da-363e-4412-99a8-00759f3dba38', '9f2610ab-b722-4637-99af-1b0d4a8e7619', 'Viên', 1, true, 5333, 7000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('50735c1a-3aaf-48d4-9071-46b1284f47d3', '9f2610ab-b722-4637-99af-1b0d4a8e7619', 'MD0012416', '2026-10-04', 0, 5333);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('06da6bdc-4055-4869-96c4-3343b3120dd0', '9f2610ab-b722-4637-99af-1b0d4a8e7619', '0', '2028-07-11', 0, 5333);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('4826ee3e-cf40-429e-ac3d-1cf135befd5f', '9f2610ab-b722-4637-99af-1b0d4a8e7619', '25001FN', '2028-07-11', 0, 5333);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('0299e181-57ac-4c9c-a90c-f96017f768ad', '9f2610ab-b722-4637-99af-1b0d4a8e7619', '25002FN', '2028-07-14', 0, 5333);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('8b72ebb3-2d23-442d-bc6e-ac08981c6444', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001006', '8936010461413', 'Cetirizin 10mg Đỏ', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('e63ea2d1-4764-4a78-801e-1ddef08e7e0b', '8b72ebb3-2d23-442d-bc6e-ac08981c6444', 'Viên', 1, true, 350, 500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('62b7450c-9899-4cf0-8c4c-d5bd8cbe7606', '8b72ebb3-2d23-442d-bc6e-ac08981c6444', '050325', '2028-03-05', 90, 350);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('c343fcdc-696a-48df-aa6e-124ebfc976d3', '8b72ebb3-2d23-442d-bc6e-ac08981c6444', '020126', '2029-01-16', 1000, 350);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('1a0184c6-a130-4253-a641-5026cd39d81f', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001003', NULL, 'Acyclovir 800mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('821ca2d7-f4a1-4897-a0dc-f61fdd2659d8', '1a0184c6-a130-4253-a641-5026cd39d81f', 'Viên', 1, true, 2264, 3500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('fe2016da-3ee1-459b-8c66-22f80ce82dc2', '1a0184c6-a130-4253-a641-5026cd39d81f', '060724', '2027-07-08', 146, 2264);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d576b134-193c-44c2-b00c-5eb3e6669953', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP001000', '8936024390983', 'Ketosan 1mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('4e158a21-617c-42f2-b540-0d1226e65b0f', 'd576b134-193c-44c2-b00c-5eb3e6669953', 'Viên', 1, true, 730, 1000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('c45868bb-5e45-47d3-b954-2d59ab655b23', 'd576b134-193c-44c2-b00c-5eb3e6669953', '00224', '2027-10-15', 162, 730);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('7e3945b9-b2e9-412f-8e36-ba9ebddddc2a', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP000999', '8936040627018', 'Eucaphor Trường Thọ', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('ac37eddb-dd36-4016-b0c2-95692c9c9546', '7e3945b9-b2e9-412f-8e36-ba9ebddddc2a', 'Lọ', 1, true, 14400, 18000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('d16e7bd0-f3df-4969-a516-6682f7d89c66', '7e3945b9-b2e9-412f-8e36-ba9ebddddc2a', '03524', '2027-12-03', 5, 14400);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('bb21c68f-a33b-4fe4-8b75-68a03a4518d9', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP000998', '8935092203164', 'Siro Ho Ích Nhi', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('1d9c4270-963a-4ad5-b146-7fb293b5bd31', 'bb21c68f-a33b-4fe4-8b75-68a03a4518d9', 'Chai', 1, true, 65000, 70000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('9b628574-dcdc-42d4-a5a8-8b9ad1ac64b6', 'bb21c68f-a33b-4fe4-8b75-68a03a4518d9', '25-1006', '2028-02-05', 0, 65000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('b8e2d605-2b58-4e62-9674-d226b025ef58', 'bb21c68f-a33b-4fe4-8b75-68a03a4518d9', '1050', '2028-10-07', 0, 65000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('bc41aad1-3bfc-49ba-836f-a5ad1f67ff68', 'bb21c68f-a33b-4fe4-8b75-68a03a4518d9', '25-1060', '2028-11-27', 0, 65000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('5248a100-884f-4934-b93e-ff6113311366', 'bb21c68f-a33b-4fe4-8b75-68a03a4518d9', '25-1062', '2028-12-05', 5, 65000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('92f0b433-90e4-4413-a06d-fdc3cc2e2c38', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP000996', '8936058822894', 'Siro Bổ Phế', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('99c4a0b4-ebde-4174-8d15-d8660440a123', '92f0b433-90e4-4413-a06d-fdc3cc2e2c38', 'Chai', 1, true, 40000, 50000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('549dce2d-7d66-4669-8c4f-f1946c79decc', '92f0b433-90e4-4413-a06d-fdc3cc2e2c38', '1150125', '2028-01-15', 0, 40000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('3ee5e41c-7565-4ed8-9192-7aa8afdde211', '92f0b433-90e4-4413-a06d-fdc3cc2e2c38', '1050225', '2029-02-05', 13, 40000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('55da2348-2eb1-4a6f-8fb4-2c8f35bffde1', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP000991', '8936099625461', 'Xịt Họng Keo Ong Hamico', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('f5bbaccd-5819-4027-ad1a-d39a43c5d7b1', '55da2348-2eb1-4a6f-8fb4-2c8f35bffde1', 'Chai', 1, true, 38000, 50000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('d1db4cfa-e6c8-4561-8375-af896f326043', '55da2348-2eb1-4a6f-8fb4-2c8f35bffde1', '032024', '2027-11-19', 5, 38000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('988d9830-c672-4124-b86a-2d725d354f44', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP000990', '8938540796430', 'Siro Cao Lá Thường Xuân', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('820471e9-c99a-45e2-87c9-034ebffa540a', '988d9830-c672-4124-b86a-2d725d354f44', 'Chai', 1, true, 52000, 70000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('847b7f7c-fd22-4f29-a8b8-e888a58cc4e2', '988d9830-c672-4124-b86a-2d725d354f44', '011124', '2027-11-24', 2, 52000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('e1dbb6de-05da-4b40-98d1-07d5e1359b5c', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000984', '8934700031618', 'Mexcold 500mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('5db8774f-4770-4e68-8e9d-baeb5a9c6dee', 'e1dbb6de-05da-4b40-98d1-07d5e1359b5c', 'Viên', 1, true, 507, 700);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('40d13243-2961-472c-b766-2ce45ab9e5c7', 'e1dbb6de-05da-4b40-98d1-07d5e1359b5c', '227C002', '2028-01-04', 314, 507);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('ef371e23-21d2-45e7-98d4-ace317a98361', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000983', '8934567002851', 'Ho Astex', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('d3699669-eda8-4fa6-ab87-6c49abbf1df3', 'ef371e23-21d2-45e7-98d4-ace317a98361', 'Chai', 1, true, 44000, 48000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('417c3215-98ce-4e51-b49c-12b99841eca7', 'ef371e23-21d2-45e7-98d4-ace317a98361', '0', '2027-10-29', 0, 44000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('98840a9e-9687-415c-a9f1-dc2296e18fff', 'ef371e23-21d2-45e7-98d4-ace317a98361', '24246', '2027-10-30', 0, 44000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('ec44984b-a601-4637-b3ac-2b8301116ec0', 'ef371e23-21d2-45e7-98d4-ace317a98361', '25065', '2028-12-02', 8, 44000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('648b9fe1-caa0-4d83-821f-279c9bf3ec60', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000980', '8935131204152', 'Alverin-40mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('2c2abbb2-608c-4c29-a0bf-2ae5a78c3e4c', '648b9fe1-caa0-4d83-821f-279c9bf3ec60', 'Viên', 1, true, 310, 500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('39679d9f-9793-4208-9ded-24db43bf5c99', '648b9fe1-caa0-4d83-821f-279c9bf3ec60', '001', '2028-01-18', 479, 310);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('37e38300-7898-4c5f-a5f9-4ff59df6e91d', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000977', NULL, 'Flexidron 90mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('f70292ff-3ccd-46f2-9767-f7c937d110a7', '37e38300-7898-4c5f-a5f9-4ff59df6e91d', 'Viên', 1, true, 4780, 5500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('9737e1f2-6af8-4675-8dd1-32810ce2fc75', '37e38300-7898-4c5f-a5f9-4ff59df6e91d', '2730231', '2027-11-21', 0, 4780);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('2a41cf8e-bce6-4b6f-96b8-db2d4e18b8ed', '37e38300-7898-4c5f-a5f9-4ff59df6e91d', '3000808', '2028-07-04', 0, 4780);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('75dc1aca-348e-4433-89ef-888c0c10bcb9', '37e38300-7898-4c5f-a5f9-4ff59df6e91d', '3000965', '2028-10-27', 45, 4780);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d7c90a00-ed9b-43fc-99c9-5bd420661e8d', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000974', '8936116252502', 'Menpeptine', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('ed6f348c-012d-4bf8-a156-3b5a7d606e7f', 'd7c90a00-ed9b-43fc-99c9-5bd420661e8d', 'Viên', 1, true, 1920, 2500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('86aca8df-230a-4072-982b-b6b74bc5e7e5', 'd7c90a00-ed9b-43fc-99c9-5bd420661e8d', '010224', '2027-02-23', 0, 1920);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('94c8abd8-4f7b-4266-86cc-e21b71af9e41', 'd7c90a00-ed9b-43fc-99c9-5bd420661e8d', '020725', '2028-07-24', 790, 1920);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('642bfc99-a00e-48ef-8261-d1b2f0cc58cf', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000971', '5000158068162', 'Gaviscon', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('bfc7fbbf-e836-498b-a2be-1cb0d7ae50d1', '642bfc99-a00e-48ef-8261-d1b2f0cc58cf', 'Gói', 1, true, 6275, 8000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('1818cafa-62fc-4738-a3fb-7394043e463a', '642bfc99-a00e-48ef-8261-d1b2f0cc58cf', 'AGL935', '2026-07-01', 0, 6275);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('b819c87a-f3ae-40b7-8ace-12319d543fa4', '642bfc99-a00e-48ef-8261-d1b2f0cc58cf', 'AGL972', '2026-07-01', 0, 6275);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('87062813-beb3-4318-a079-f1321768bb11', '642bfc99-a00e-48ef-8261-d1b2f0cc58cf', 'AHM396', '2027-09-26', 144, 6275);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('8d4c0477-7f51-4b05-bbe6-b5895504ae0c', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000968', '8936134271745', 'Rebastric 100mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('88643e8a-ac26-475c-babc-e6d182831b8a', '8d4c0477-7f51-4b05-bbe6-b5895504ae0c', 'Viên', 1, true, 1866, 2500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('d7a90430-c040-4a8f-b650-bab81330a84d', '8d4c0477-7f51-4b05-bbe6-b5895504ae0c', '011023', '2026-10-02', 115, 1866);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('1407c3bf-32b8-4e66-ba16-c1b5bb5711c9', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000965', NULL, 'Esomeprazol 20mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('4a5afedc-3d1e-4c3c-8df7-bc2a77b5d02f', '1407c3bf-32b8-4e66-ba16-c1b5bb5711c9', 'Viên', 1, true, 740, 2000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('9a343fd4-ed2a-46f9-8be6-80731d7d360b', '1407c3bf-32b8-4e66-ba16-c1b5bb5711c9', '3721224', '2026-12-17', 0, 740);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('9961dd88-5cdb-46d5-a96b-46351d879146', '1407c3bf-32b8-4e66-ba16-c1b5bb5711c9', '2570126', '2028-02-05', 1163, 740);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('5d2c7ad4-e2c0-43b4-857b-fb1e60ad9138', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000962', '8935076035118', 'Trimebutin 100mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('0c0f4152-b5b8-4dd6-8e3f-406e7171ad9a', '5d2c7ad4-e2c0-43b4-857b-fb1e60ad9138', 'Viên', 1, true, 750, 1500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('5c0ff08f-faf4-49e1-893f-7d0e47c438eb', '5d2c7ad4-e2c0-43b4-857b-fb1e60ad9138', '003-121124', '2027-11-14', 190, 750);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('f9d533f5-e7b5-466e-8c1e-e344945bcbb1', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000958', '8936022470045', 'Atussin', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('3f71063d-ff3b-409a-908a-b44d4b8240a7', 'f9d533f5-e7b5-466e-8c1e-e344945bcbb1', 'Chai', 1, true, 25000, 28000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('3689b66c-ce41-4f29-9b79-32b0c3fbd83f', 'f9d533f5-e7b5-466e-8c1e-e344945bcbb1', '414221', '2026-10-06', 8, 25000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('08aef492-0662-4edd-86dc-c8364ca6f0b4', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000952', NULL, 'Motilium-M', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('357286f8-2202-404e-9652-6d03303f0f75', '08aef492-0662-4edd-86dc-c8364ca6f0b4', 'Viên', 1, true, 2170, 2500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('9a8907c9-be2c-4644-99ab-e7c04791fbd8', '08aef492-0662-4edd-86dc-c8364ca6f0b4', '2426015', '2029-02-28', 120, 2170);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('91729db6-e27a-4e4e-8fa0-b986fd7275fd', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000950', '4104480705670', 'Siro Prospan', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('9580c3e7-19e2-42ad-b720-cc4ea41e9b66', '91729db6-e27a-4e4e-8fa0-b986fd7275fd', 'Chai', 1, true, 87000, 90000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('d38231de-e662-4c36-8036-26494e9b9500', '91729db6-e27a-4e4e-8fa0-b986fd7275fd', '24C099A', '2027-02-28', 0, 87000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('91959fd0-575c-4ada-9389-74b92062fb28', '91729db6-e27a-4e4e-8fa0-b986fd7275fd', '0', '2027-05-31', 0, 87000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('64e2d305-f267-492c-8ef8-e45d5f4016f0', '91729db6-e27a-4e4e-8fa0-b986fd7275fd', '010a', '2027-12-31', 0, 87000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('c59e0cec-bfc6-45e4-9064-a011c2607148', '91729db6-e27a-4e4e-8fa0-b986fd7275fd', '25a117a', '2028-01-30', 2, 87000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('3559456e-516d-44e1-a160-041105c89482', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000947', NULL, 'Neo-Godian', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('63a22943-c5bf-49ae-92cc-2cd05d6a99cc', '3559456e-516d-44e1-a160-041105c89482', 'Viên', 1, true, 400, 600);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('5c71ced1-d964-423a-8e5e-ba6162ed1582', '3559456e-516d-44e1-a160-041105c89482', '1725', '2028-04-26', 0, 400);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('06ce48fe-98f4-4c54-81e8-1325c8e0808b', '3559456e-516d-44e1-a160-041105c89482', '2125', '2028-05-26', 290, 400);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('ed89fe4c-6769-4186-b206-77789aa59d1d', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000944', '8936022471318', 'Kremil-S', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('efd473e6-9add-4b97-a86b-07cb45a58e2e', 'ed89fe4c-6769-4186-b206-77789aa59d1d', 'Viên', 1, true, 1144, 1500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('e01088d9-c391-4c3b-b5a8-168203eb0d62', 'ed89fe4c-6769-4186-b206-77789aa59d1d', '504661', '2028-03-31', 369, 1144);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('af8e76d1-060b-4105-ab3c-9118bc03376b', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000942', NULL, 'Panadol Việt Nam', true, '4f0897b5-b56e-41ca-9046-9d20dbdf6988', 'Việt Nam');
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('c79f8a4d-cae1-486a-be9f-977d0964123c', 'af8e76d1-060b-4105-ab3c-9118bc03376b', 'Viên', 1, true, 540, 833);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('6e4cd1f1-cced-4180-9b12-b146a0e02eea', 'af8e76d1-060b-4105-ab3c-9118bc03376b', '0', '2027-10-18', 0, 540);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('cf4f5e9c-1e71-41b0-8d20-617de6c00d16', 'af8e76d1-060b-4105-ab3c-9118bc03376b', '0925', '2028-09-17', 103, 540);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('e286cd5e-a885-49a1-a2fe-55e295052244', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000933', '8936022470182', 'Dolfenal 500mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('9e8251bf-f721-4e0f-8513-19086cb76eb8', 'e286cd5e-a885-49a1-a2fe-55e295052244', 'Viên', 1, true, 1376.32, 2000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('3de6ace0-f395-4959-b542-d400c0f1c044', 'e286cd5e-a885-49a1-a2fe-55e295052244', '409541', '2028-06-18', 18, 1376.32);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('caa64bc6-6614-4c7e-881f-aee806960c35', 'e286cd5e-a885-49a1-a2fe-55e295052244', '519731', '2029-11-24', 200, 1376.32);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('4bb45e00-0aef-47dd-a055-aae13e65d555', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000928', NULL, 'Paralmax 500mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('7c4e9641-f508-454d-a5ba-579398843305', '4bb45e00-0aef-47dd-a055-aae13e65d555', 'Viên', 1, true, 1500, 2500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('60c66227-8a3a-47ac-a990-8bc38b679b90', '4bb45e00-0aef-47dd-a055-aae13e65d555', '351024', '2027-10-07', 0, 1500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('6bddf70f-7907-4079-9602-67d10455f406', '4bb45e00-0aef-47dd-a055-aae13e65d555', '0', '2028-03-17', 0, 1500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('3d11699b-179d-4233-b4ce-7d741ef52f53', '4bb45e00-0aef-47dd-a055-aae13e65d555', '281025', '2028-12-04', 222, 1500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d42a2302-4c5d-42d8-8d99-6cf0110bfa59', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000925', NULL, 'Diclofenac 75mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('8ed9cefe-a599-4ff3-b5f3-44bfa3442122', 'd42a2302-4c5d-42d8-8d99-6cf0110bfa59', 'Viên', 1, true, 265, 500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('389d2963-734f-421f-898c-56a21ba2333d', 'd42a2302-4c5d-42d8-8d99-6cf0110bfa59', '170225', '2028-02-13', 842, 265);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('961ccb2d-68ff-411f-8d11-d3b6037e99f3', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000922', NULL, 'Omeraz 20mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('bf3a9f2d-6ff2-4a34-bd6e-a67b5af77640', '961ccb2d-68ff-411f-8d11-d3b6037e99f3', 'Viên', 1, true, 1365, 1500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('ac61d177-b238-411d-a6c5-9a8e7ddbde39', '961ccb2d-68ff-411f-8d11-d3b6037e99f3', '100125', '2027-06-17', 160, 1365);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('be38b30c-52e4-4578-a83e-1c0743cbe41b', '961ccb2d-68ff-411f-8d11-d3b6037e99f3', '230624', '2027-06-17', 0, 1365);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('4a57745a-19c5-48fb-afed-214c67625d47', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000920', '01502921', 'Efferagan 500mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('367395d6-aace-428c-aa35-b493bdc348ba', '4a57745a-19c5-48fb-afed-214c67625d47', 'Viên', 1, true, 3000, 5000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('6de37ab2-791d-4b07-90d1-f55709d66b4e', '4a57745a-19c5-48fb-afed-214c67625d47', 'B5470', '2027-09-18', 0, 3000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('ab4bd914-c7cf-49c4-8c59-c0a0ef7c0e17', '4a57745a-19c5-48fb-afed-214c67625d47', '0', '2028-02-10', 0, 3000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('11f704e8-81d4-45a3-b59d-3384e269087a', '4a57745a-19c5-48fb-afed-214c67625d47', 'B9463', '2028-06-30', 0, 3000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('80186a62-c1fa-40af-bb8c-31d457a24cb8', '4a57745a-19c5-48fb-afed-214c67625d47', 'C0042', '2028-09-17', 80, 3000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('894d6f10-6613-497b-b5a3-4f2ab13469e5', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000918', '8936123411312', 'Phosphalugel', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('e24c9cc2-77f1-4927-b80f-37b63d7abe53', '894d6f10-6613-497b-b5a3-4f2ab13469e5', 'Gói', 1, true, 3950, 5000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('784a8528-43b6-452c-8078-3bf9bfabc991', '894d6f10-6613-497b-b5a3-4f2ab13469e5', '428682', '2027-12-05', 99.01, 3950);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('f5b7407a-8cf4-4a36-93d2-92d47b94c0d4', '894d6f10-6613-497b-b5a3-4f2ab13469e5', '528129', '2028-02-27', 0, 3950);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('9aa3d54b-8e8f-4612-b777-6e0540b4a222', '894d6f10-6613-497b-b5a3-4f2ab13469e5', '528606', '2028-10-22', 78, 3950);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('abe050d9-d499-4a1a-8d22-65e7d52407a4', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000913', '8936014420980', 'Tiffy', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('dcfbcc5e-cbc3-4520-81b7-d869dc057215', 'abe050d9-d499-4a1a-8d22-65e7d52407a4', 'Viên', 1, true, 1140, 1500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('16507fdb-0e4f-4b4f-ac9c-e3651a8fe10d', 'abe050d9-d499-4a1a-8d22-65e7d52407a4', '1180724', '2029-07-22', 84, 1140);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('19cc317c-33ec-4bea-b53c-4d0c60f319b8', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000910', '8935206022261', 'Hapacol 650mg', true, 'adf3126f-fbe7-4be2-b87a-d0b41fe2bc64', '650mg');
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('700b2946-8fe3-4df0-89ce-bc13d937e662', '19cc317c-33ec-4bea-b53c-4d0c60f319b8', 'Viên', 1, true, 552, 800);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('82b3f047-8fda-4335-973c-e0f4e0b50f31', '19cc317c-33ec-4bea-b53c-4d0c60f319b8', '0', '2028-02-18', 164, 552);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('0c31a4e6-c4ae-4210-adb0-a73c87c3d28b', '19cc317c-33ec-4bea-b53c-4d0c60f319b8', '060425', '2028-04-01', 0, 552);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('514c2394-03b1-4bd2-b8a3-93e07d028636', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000907', '8936018670510', 'Tiram 100mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('fb0acbea-9a99-41c4-aeae-125ec255fbdb', '514c2394-03b1-4bd2-b8a3-93e07d028636', 'Viên', 1, true, 990, 1500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('06fb1c4d-1056-496d-986f-45b7ac6635eb', '514c2394-03b1-4bd2-b8a3-93e07d028636', '4007', '2027-12-17', 0, 990);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('72600a68-4c94-4afc-8e62-b2961fed702a', '514c2394-03b1-4bd2-b8a3-93e07d028636', 'TRT5003', '2028-09-16', 380, 990);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('b865eeac-926d-4bbe-a7ab-adab3c5490bc', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000904', '8936144800997', 'Vacodomtium 20mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('3442275c-507c-40ff-8b8a-ea528f61ca81', 'b865eeac-926d-4bbe-a7ab-adab3c5490bc', 'Viên', 1, true, 400, 1000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('4a9649d9-5d81-4dad-b1e8-410985bb642f', 'b865eeac-926d-4bbe-a7ab-adab3c5490bc', '0940924', '2027-09-27', 450, 400);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('caa9f722-fdf3-459d-91fa-551e06d2fb25', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000901', '8936085366538', 'Mezolax 40mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('990441d0-e7b7-4298-973f-f87539b9826e', 'caa9f722-fdf3-459d-91fa-551e06d2fb25', 'Viên', 1, true, 2160, 4000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('d77c9474-b3b2-4798-8bfc-48dde6fbb1f0', 'caa9f722-fdf3-459d-91fa-551e06d2fb25', '030724', '2027-08-02', 57, 2160);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d7e0e6f1-6bea-4262-b706-dbe89e1cb932', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000899', '8936022471028', 'Decolgen ND', true, '8c1efe46-d774-4fda-87ed-9baf23350b20', 'ND');
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('6f64ffb2-4b09-42b4-9076-258e1c366e55', 'd7e0e6f1-6bea-4262-b706-dbe89e1cb932', 'Viên', 1, true, 1125, 1500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('df4efa04-f70c-4ee0-be0b-59ab7fcccc05', 'd7e0e6f1-6bea-4262-b706-dbe89e1cb932', '413321', '2027-07-29', 0, 1125);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('8b4a8066-575d-46f4-9cc9-8cfca4177416', 'd7e0e6f1-6bea-4262-b706-dbe89e1cb932', '503371', '2029-02-20', 196, 1125);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('20a27592-9eae-4182-858b-85a9a251862a', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000896', '8935137700719', 'Cetecoleceti 40mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('8bc493d2-a058-42fc-93c4-d48c6b5182bc', '20a27592-9eae-4182-858b-85a9a251862a', 'Viên', 1, true, 1000, 2000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('fe1d4b05-a187-49f6-b8fc-31f251a5ad99', '20a27592-9eae-4182-858b-85a9a251862a', '04/0824', '2027-08-01', 0, 1000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('16cc469a-7e16-43b8-82fd-9a8afa63a346', '20a27592-9eae-4182-858b-85a9a251862a', '0', '2028-07-08', 672, 1000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('e7493124-4423-41a4-aece-26c69ce734aa', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP000893', '8936024920746', 'Bông tâm đầu lớn', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('766c4dea-77be-49f9-a985-6a3e90da716f', 'e7493124-4423-41a4-aece-26c69ce734aa', 'Gói', 1, true, 4000, 5000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                VALUES ('8be77410-7188-4fcf-9e28-3b3881433b5d', 'e7493124-4423-41a4-aece-26c69ce734aa', 'LO-MACDINH', '2099-12-31', 18, 4000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('9de6b2c0-b449-4df3-ba60-29c8c79cde0f', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP000892', NULL, 'Gạc y tế lớn', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('4191e6ce-634a-437e-ab83-51a030ec7013', '9de6b2c0-b449-4df3-ba60-29c8c79cde0f', 'Gói', 1, true, 5840, 10000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('91ad600f-b7b2-4fc4-b9e5-9f8b2543d5ed', '9de6b2c0-b449-4df3-ba60-29c8c79cde0f', '1024', '2027-10-01', 0, 5840);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('c46c10b0-ad6c-4605-ad73-15b5ffa0b2a2', '9de6b2c0-b449-4df3-ba60-29c8c79cde0f', '0126G8', '2029-01-31', 0, 5840);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('5a378225-c818-4da2-ba17-72a911c54c59', '9de6b2c0-b449-4df3-ba60-29c8c79cde0f', '0326G8', '2029-03-31', 68, 5840);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d972d6fc-d2f4-4d81-82d3-e6b13ad39b9b', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP000891', NULL, 'Băng keo vải liên kết 1.25x200cm', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('59fa4654-96a8-4119-80eb-b33e751cf569', 'd972d6fc-d2f4-4d81-82d3-e6b13ad39b9b', 'Cuộn', 1, true, 1901, 3000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('8968ce6f-710d-4721-ad6e-26dd7c08690a', 'd972d6fc-d2f4-4d81-82d3-e6b13ad39b9b', '012024', '2030-01-01', 49, 1901);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('b77639f2-cdaf-49c7-b465-b6aa2a1713a6', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP000890', NULL, 'Băng thun mỏng', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('4ff2b789-e5d3-425b-96fb-ef422218787b', 'b77639f2-cdaf-49c7-b465-b6aa2a1713a6', 'Cuộn', 1, true, 1500, 3000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('000304bb-0420-4aab-a609-b4ce71a4ee79', 'b77639f2-cdaf-49c7-b465-b6aa2a1713a6', '050824', '2027-08-05', 9, 1500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('733877a1-762a-4eba-a963-97306d23d87e', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP000889', NULL, 'Gạc y tế nhỏ', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('24470c6c-d2aa-4be3-b146-4e28dfa4123a', '733877a1-762a-4eba-a963-97306d23d87e', 'Gói', 1, true, 0, 5000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('0a0c60c4-a9aa-4941-b6c9-df86b2db259a', '733877a1-762a-4eba-a963-97306d23d87e', '0724', '2027-07-01', 0, 0);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('4eef1a2b-2e36-46e9-b8ca-8b6c5b510138', '733877a1-762a-4eba-a963-97306d23d87e', '0226G5', '2029-02-28', 102, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('cb829a0e-e74b-4bd9-9ffa-9dc69a33a671', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP000888', '8936024920326', 'Bông tâm đầu nhỏ', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('7f81ab4c-f44a-49d1-aebd-26e517e62c8c', 'cb829a0e-e74b-4bd9-9ffa-9dc69a33a671', 'Gói', 1, true, 0, 5000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('b1564d92-50b1-411d-a471-936e9c4f7492', 'cb829a0e-e74b-4bd9-9ffa-9dc69a33a671', '0', '2027-01-01', 1, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('2fa1ddf3-293d-4f21-a000-003a70d1da8d', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000887', NULL, 'New Choice', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('5fb41fe3-25f6-4a60-b848-16534de5388b', '2fa1ddf3-293d-4f21-a000-003a70d1da8d', 'Hộp', 1, true, 8320, 10000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('d2208f4a-e06d-4c95-a76f-f7eedb30790c', '2fa1ddf3-293d-4f21-a000-003a70d1da8d', '23126', '2028-12-01', 28, 8320);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('46c27ca6-7181-4067-b2d8-1b500f111822', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP000886', NULL, 'Gỗ Đè Lưỡi', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('380e1bce-cd78-4ee1-9400-6e1c7053b4f2', '46c27ca6-7181-4067-b2d8-1b500f111822', 'Que', 1, true, 25000, 300);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('422f3e08-ac7b-471c-bc1b-41e207702ff6', '46c27ca6-7181-4067-b2d8-1b500f111822', '0', '2027-01-01', 300, 25000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('c7ea4939-f9da-4a0a-ba46-5f1040e1caeb', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000885', NULL, 'Marvelon', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('963220e4-62ea-4789-9611-831f49d086e2', 'c7ea4939-f9da-4a0a-ba46-5f1040e1caeb', 'Hộp', 1, true, 82150, 85000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('a52cd9f4-b5ad-44c2-90c7-0da9d63f2f18', 'c7ea4939-f9da-4a0a-ba46-5f1040e1caeb', 'B117025', '2027-04-23', 0, 82150);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('b11914fb-6034-4892-b76f-64ebb4dcd691', 'c7ea4939-f9da-4a0a-ba46-5f1040e1caeb', 'B117756', '2027-06-28', 0, 82150);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('ea8eb06f-c573-4df6-8cb7-ee1306b2b276', 'c7ea4939-f9da-4a0a-ba46-5f1040e1caeb', 'B120946', '2027-10-23', 0, 82150);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('32b60416-b082-4aff-9234-78356c0cea25', 'c7ea4939-f9da-4a0a-ba46-5f1040e1caeb', 'B120681', '2027-10-31', 5, 82150);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('008746e8-a364-47dc-910a-3ff8b771a1a9', 'c7ea4939-f9da-4a0a-ba46-5f1040e1caeb', 'C122532', '2027-11-20', 10, 82150);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('6a3ef815-32ca-4c29-ad19-3735300c25b0', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000884', NULL, 'Postinor-1', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('f6a98bac-7064-4eba-b852-a01edd7d1aa8', '6a3ef815-32ca-4c29-ad19-3735300c25b0', 'Hộp', 1, true, 34000, 40000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('3e84d0d5-ea73-469b-a6fb-40b063a535b6', '6a3ef815-32ca-4c29-ad19-3735300c25b0', 'T46247S', '2028-06-01', 0, 34000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('e6e54c9d-dfa6-4371-ae75-5cc1abcbf659', '6a3ef815-32ca-4c29-ad19-3735300c25b0', 'T42647T', '2028-06-30', 0, 34000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('216b89d2-35a4-446d-8fb4-134f998f825e', '6a3ef815-32ca-4c29-ad19-3735300c25b0', 'T4B482E', '2028-11-30', 0, 34000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('8f401502-8172-4a91-9149-7b0a1966fb03', '6a3ef815-32ca-4c29-ad19-3735300c25b0', 'T52538T', '2029-01-31', 65, 34000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('195e5a9a-8232-4c0a-9676-ff8f4cea9b7f', '6a3ef815-32ca-4c29-ad19-3735300c25b0', 'T52537C', '2029-02-28', 5, 34000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('6679470d-4da1-4203-9d2d-6f4098262303', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000883', '99024864', 'Drosperin', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('3e81afcc-5e6f-444c-b95a-8cff83eebbe3', '6679470d-4da1-4203-9d2d-6f4098262303', 'Hộp', 1, true, 155800, 160000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('99b7133b-7415-44a0-8c2f-b3269fb5430c', '6679470d-4da1-4203-9d2d-6f4098262303', 'J240918', '2027-09-01', 0, 155800);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('0735a2b4-42fd-4718-aa13-5b62e106fdb1', '6679470d-4da1-4203-9d2d-6f4098262303', 'k240994', '2027-10-31', 0, 155800);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('37a4be2f-1b74-4d60-9928-1b9442f8cddd', '6679470d-4da1-4203-9d2d-6f4098262303', 'B250131', '2028-01-31', 0, 155800);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('722d38a5-e8e0-4927-be50-61db3f4575a7', '6679470d-4da1-4203-9d2d-6f4098262303', 'C250193', '2028-02-29', 0, 155800);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('5ba94d45-01c8-49ed-b9b0-0b893ee4fd5f', '6679470d-4da1-4203-9d2d-6f4098262303', 'G250712', '2028-06-30', 1, 155800);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('0b9b6623-e3ce-40e3-9796-bd040b192a20', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000881', NULL, 'Mercilon', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('e7bb5198-cef1-4dc7-8c48-ab8eaba07415', '0b9b6623-e3ce-40e3-9796-bd040b192a20', 'Hộp', 1, true, 83000, 92000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('79eaf2cf-cad1-4d73-8265-0e7089108ca4', '0b9b6623-e3ce-40e3-9796-bd040b192a20', '0', '2027-01-01', 3, 83000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('96dabb39-4b3f-4a0b-af3b-6897cb696667', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000880', '8437019299392', 'Rosepire', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('9853dcfa-f3f2-4eca-97bb-6183abcaf75e', '96dabb39-4b3f-4a0b-af3b-6897cb696667', 'Hộp', 1, true, 121700, 135000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('ad572b48-b86a-4f8e-bdc3-96104501249f', '96dabb39-4b3f-4a0b-af3b-6897cb696667', 'LF37020A', '2027-03-15', 4, 121700);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('7a804142-1edb-4605-a4b4-f61700fe1ebf', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP000879', NULL, 'Nhiệt kế lilika', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('cd7fed76-033d-463c-a49f-e510b56e4438', '7a804142-1edb-4605-a4b4-f61700fe1ebf', 'Cái', 1, true, 18225, 30000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('d927807d-691e-448e-afbd-d4fc2b0bd2d9', '7a804142-1edb-4605-a4b4-f61700fe1ebf', '1', '2028-01-01', 0, 18225);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('1864e289-766c-4c86-8ef4-9d22809e6cab', '7a804142-1edb-4605-a4b4-f61700fe1ebf', '20082025', '2030-08-19', 7, 18225);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('5ae540d8-c15d-402b-aa4a-4ec24f04f4c5', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000878', NULL, 'Diane-35', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('4241b204-d1b0-4e6a-b338-df5d3db72bac', '5ae540d8-c15d-402b-aa4a-4ec24f04f4c5', 'Hộp', 1, true, 135500, 140000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('f8f570c3-5153-4358-96ad-3a8083759c20', '5ae540d8-c15d-402b-aa4a-4ec24f04f4c5', 'KT0PJJF', '2027-01-19', 2, 135500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('3e29e899-253d-425d-b7f0-b917b95ea4ef', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000874', '8935286500321', 'Thuốc Ngừa Thai Khẩn Cấp', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('38ccd112-5031-4d6e-9694-e777793a61f5', '3e29e899-253d-425d-b7f0-b917b95ea4ef', 'Viên', 1, true, 5100, 10000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('11f17f77-2299-484a-b283-fbf914436bc3', '3e29e899-253d-425d-b7f0-b917b95ea4ef', '0031224', '2027-12-03', 9, 5100);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('64259264-f11c-4340-b0e3-f1fb91e7baec', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP000870', '8938507697503', 'Gel Bôi Trơn Rocmen', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('1356575a-0231-4f60-85ad-ffe1b8b29cc9', '64259264-f11c-4340-b0e3-f1fb91e7baec', 'Hộp', 1, true, 25800, 50000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('e6d4d4ba-1233-4dd8-89ab-aa21a8aea4cf', '64259264-f11c-4340-b0e3-f1fb91e7baec', '1241001', '2027-09-01', 4, 25800);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('e8b4d96e-4ee9-481d-9de3-07aac3b2509a', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP000869', '8938554952143', 'Que Thử Thai Baby', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('68fab13d-cfbd-49c9-8e88-8b1e540e5cd4', 'e8b4d96e-4ee9-481d-9de3-07aac3b2509a', 'Hộp', 1, true, 8000, 15000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('586080a3-5789-4ca5-97ba-fb1073799f0d', 'e8b4d96e-4ee9-481d-9de3-07aac3b2509a', '0', '2028-01-01', 4, 8000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('ffe37d03-51b9-4f30-9469-2dd271729b57', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP000866', '8938521053019', 'Bom tiem 1CC', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('4d4ff79c-5a19-49e4-821c-071549242431', 'ffe37d03-51b9-4f30-9469-2dd271729b57', 'Cái', 1, true, 710, 1000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('1b99dfaf-a8f6-45a5-92fb-e971ff274c2f', 'ffe37d03-51b9-4f30-9469-2dd271729b57', '0', '2028-01-01', 0, 710);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('efffd6dd-f586-45df-9dc6-7f70b815e0aa', 'ffe37d03-51b9-4f30-9469-2dd271729b57', '0304', '2029-04-03', 0, 710);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('1344f349-6b20-4194-8d8f-1b4029b65492', 'ffe37d03-51b9-4f30-9469-2dd271729b57', '081225', '2030-12-08', 155, 710);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('6dc3fad2-97d0-4760-8abb-3fb65fa4d86e', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP000865', '8938507697022', 'Bao Cao Su Hoa Hồng Lớn', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('891348d9-82de-4c4d-95f7-df8f4766dbc4', '6dc3fad2-97d0-4760-8abb-3fb65fa4d86e', 'Hộp', 1, true, 8000, 20000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('2157ceb9-df82-41f6-bebe-96e829854d82', '6dc3fad2-97d0-4760-8abb-3fb65fa4d86e', '0', '2027-01-01', 0, 8000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('0dd8a83f-bb6b-4ff3-ad25-68b33120d2ba', '6dc3fad2-97d0-4760-8abb-3fb65fa4d86e', 'VD24002', '2029-09-01', 0, 8000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('5b30e92a-cee3-42c8-9f6c-981267c55909', '6dc3fad2-97d0-4760-8abb-3fb65fa4d86e', '06.2025', '2030-06-30', 20, 8000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('98a548d6-869e-4a35-aead-2eef2a45fda5', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP000863', '8936096450011', 'Bao Cao Su Ok', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('550dd46b-4687-4a2a-aa4a-b144f1873f5e', '98a548d6-869e-4a35-aead-2eef2a45fda5', 'Hộp', 1, true, 3500, 10000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('cdb0de9f-cef5-4e67-bf94-332f02ada5a7', '98a548d6-869e-4a35-aead-2eef2a45fda5', 'CD0201', '2028-01-01', 0, 3500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('8d0cad95-c1d0-458d-9e49-d7bdf25bdf81', '98a548d6-869e-4a35-aead-2eef2a45fda5', 'CF1102', '2030-11-30', 47, 3500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('2b60882a-782b-4e61-9649-d12dca3b3b81', '6afa32c5-1630-49f2-9d0f-06168b96b389', 'SP000861', NULL, 'Salonsip', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('34225782-53da-4395-a135-3938b520f421', '2b60882a-782b-4e61-9649-d12dca3b3b81', 'Gói', 1, true, 29000, 34000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('d56e2abb-dc8f-4012-be83-785f7f0e9230', '2b60882a-782b-4e61-9649-d12dca3b3b81', '8904', '2027-05-13', 18, 29000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('fc0b0652-c60b-48f2-b07f-076b2b92ca59', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000858', '8936098968033', 'Vnp Nhiệt miệng', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('a7c0a141-c46f-45c2-a440-172381922719', 'fc0b0652-c60b-48f2-b07f-076b2b92ca59', 'Tuýp', 1, true, 20000, 25000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('2ab7868d-1220-4983-932f-90763b11cfc1', 'fc0b0652-c60b-48f2-b07f-076b2b92ca59', '0', '2027-01-01', 1, 20000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('3aaaa90a-2afa-4c39-ad35-0398d72bb580', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000857', '8936218612259', 'Gel Bôi Niêm Mạc Lafori', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('5e7e9d69-4b61-4a8d-ba1a-6853242c31e3', '3aaaa90a-2afa-4c39-ad35-0398d72bb580', 'Tuýp', 1, true, 30000, 40000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('568ec859-db60-455d-9699-eba1f0d108ff', '3aaaa90a-2afa-4c39-ad35-0398d72bb580', '01', '2027-04-01', 0, 30000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('123c8976-a634-4db9-a001-c03f02363dc6', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000856', '8936027006348', 'Fendexi Forte 10g', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('519bfacf-ecc1-470c-9ee8-3bfbc7839559', '123c8976-a634-4db9-a001-c03f02363dc6', 'Tuýp', 1, true, 39300, 50000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('e73bb23c-b85f-4de9-b9ea-933a294da580', '123c8976-a634-4db9-a001-c03f02363dc6', '24001', '2027-01-29', 54, 39300);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('85c9114e-3384-4700-ac7e-f5c1623e9121', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000855', NULL, 'Bactronil mupirocin 2%', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('77af8d62-e2c6-4196-9fd1-c66cf829ba80', '85c9114e-3384-4700-ac7e-f5c1623e9121', 'Tuýp', 1, true, 32000, 35000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('8572e9b6-99c4-4d14-bae9-f6dff85ec4de', '85c9114e-3384-4700-ac7e-f5c1623e9121', '4J04B', '2026-10-18', 13, 32000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('10e038b3-561c-458f-93cf-a266cd351958', '6afa32c5-1630-49f2-9d0f-06168b96b389', 'SP000854', '8936064217820', 'Dau gio kim Agi', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('7b72bb3a-d962-489a-885b-ca39c202e094', '10e038b3-561c-458f-93cf-a266cd351958', 'Chai', 1, true, 0, 25000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('8b00b9e6-fa73-40b7-89d0-f79475c56dd0', '10e038b3-561c-458f-93cf-a266cd351958', '101123', '2028-11-22', 1, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('53ece932-0d2f-400b-bbd1-a256e67731e2', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000853', NULL, 'Silkron cream', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('c8e9046a-2458-44cf-ba75-67c4a4a12bef', '53ece932-0d2f-400b-bbd1-a256e67731e2', 'Tuýp', 1, true, 19300, 22000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('b7021fa7-0bf8-4735-9ddf-bc64a5dfe6ae', '53ece932-0d2f-400b-bbd1-a256e67731e2', 'RSK2D719', '2027-11-05', 0, 19300);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('92e2b4cd-a4ac-4412-a983-e75de11c626c', '53ece932-0d2f-400b-bbd1-a256e67731e2', '020825', '2027-11-17', 0, 19300);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('f6b2efd4-9079-4803-8fa5-f5e7f5141c02', '53ece932-0d2f-400b-bbd1-a256e67731e2', 'RSK2E707', '2028-02-27', 0, 19300);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('e65a92c7-9bd9-4cdb-bdac-c84166885f86', '53ece932-0d2f-400b-bbd1-a256e67731e2', 'RSK2E708', '2028-03-09', 0, 19300);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('abc350f8-4fc1-4c34-b088-42f1c672bbcc', '53ece932-0d2f-400b-bbd1-a256e67731e2', 'RSK2E718', '2028-11-10', 12, 19300);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('264a0143-5906-419c-b880-83020453c90b', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000852', '8936027000995', 'Gentridecme Cream', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('7b2fddae-dc71-449b-bba3-1f113b0a6df6', '264a0143-5906-419c-b880-83020453c90b', 'Tuýp', 1, true, 14300, 17000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('5d9cb7c0-1fef-4b65-8075-27f6619a9082', '264a0143-5906-419c-b880-83020453c90b', '24011', '2027-01-29', 0, 14300);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('7577c789-cc64-4c19-bc59-b5d01b2babb9', '264a0143-5906-419c-b880-83020453c90b', '0', '2027-09-04', 0, 14300);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('710ad2b0-e178-4985-8612-1034f5310d47', '264a0143-5906-419c-b880-83020453c90b', '25010', '2028-02-16', 12, 14300);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('4ddd3b5c-8bc5-40eb-9c9a-7b2a2e7be992', '6afa32c5-1630-49f2-9d0f-06168b96b389', 'SP000851', NULL, 'Erythromycin & nghệ medipharco', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('50162e87-7c8a-41f0-972a-7c23c0748ce7', '4ddd3b5c-8bc5-40eb-9c9a-7b2a2e7be992', 'Tuýp', 1, true, 0, 20000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('b97a1637-b5d9-40fd-b207-0e7dad33ee29', '4ddd3b5c-8bc5-40eb-9c9a-7b2a2e7be992', '130424', '2027-04-27', 1, 0);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('98fda46a-4fea-416e-9602-233ca756012b', '4ddd3b5c-8bc5-40eb-9c9a-7b2a2e7be992', '26105', '2030-01-23', 10, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('2e91ad98-9b8e-426a-aee7-a976c4d25dab', '6afa32c5-1630-49f2-9d0f-06168b96b389', 'SP000850', '8938503584197', 'Yoosun rau má', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('6bf78b55-d89e-40b6-b77c-e28d514c8cce', '2e91ad98-9b8e-426a-aee7-a976c4d25dab', 'Tuýp', 1, true, 27000, 30000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('993ca66f-233d-4531-baeb-77cff7fb06e2', '2e91ad98-9b8e-426a-aee7-a976c4d25dab', '020125', '2028-01-01', 0, 27000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('e39d019a-dac2-421c-a3bb-7535f707f143', '2e91ad98-9b8e-426a-aee7-a976c4d25dab', '020525', '2028-05-01', 0, 27000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('f15ba40d-5610-4471-b798-fb7ce6519b98', '2e91ad98-9b8e-426a-aee7-a976c4d25dab', '040525', '2028-05-01', 8, 27000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('07277f11-2869-4e8c-9014-4b179a01c7aa', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000849', NULL, 'Hepgentex', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('bb90f9a2-50ea-46dc-92de-23fe1a56f127', '07277f11-2869-4e8c-9014-4b179a01c7aa', 'Tuýp', 1, true, 35900, 38000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('8c669c1d-70fb-46a5-b202-3429435b55bb', '07277f11-2869-4e8c-9014-4b179a01c7aa', '0281124', '2026-11-05', 0, 35900);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('3eef1396-59ae-4d72-af17-9611cc49a08a', '07277f11-2869-4e8c-9014-4b179a01c7aa', '0', '2028-01-01', 1, 35900);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('624ef015-1686-4eac-9c65-698b1155141a', '6afa32c5-1630-49f2-9d0f-06168b96b389', 'SP00084800', '8938530372538', 'Baby cream sano- Nano bạc', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('0feeb441-4557-4d46-b2cf-2bf6e77a99cd', '624ef015-1686-4eac-9c65-698b1155141a', 'Tuýp', 1, true, 50000, 75000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('cd84a19a-8618-42e4-8e33-4c84ed0f47dc', '624ef015-1686-4eac-9c65-698b1155141a', '070125', '2028-01-08', 0, 50000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('e23a0a9b-aaf5-4e0a-9b9b-f13f37d645ae', '624ef015-1686-4eac-9c65-698b1155141a', '080725', '2028-07-20', 11, 50000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('e5b53459-371f-4ac8-b293-d4d2a4584f63', '6afa32c5-1630-49f2-9d0f-06168b96b389', 'SP000846', '4713248405358', 'Ecosip', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('b3c784c6-6115-4ed3-b956-43daa7fa74d6', 'e5b53459-371f-4ac8-b293-d4d2a4584f63', 'Gói', 1, true, 15000, 17000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('63fc0107-6b6a-4625-898c-81b0aac75cec', 'e5b53459-371f-4ac8-b293-d4d2a4584f63', 'ACK14A', '2027-11-13', 0, 15000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('c42c48f9-a2f3-48ec-b0dc-59a0b70505ee', 'e5b53459-371f-4ac8-b293-d4d2a4584f63', 'AEC05A', '2029-03-04', 24, 15000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('571ae329-da83-47ae-bebc-55d361c1cf63', '6afa32c5-1630-49f2-9d0f-06168b96b389', 'SP00084', '8936097590020', 'Tinh Dầu Tràm Bé Thơ', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('6532028d-44f9-4a5c-b11e-18c16618a1c5', '571ae329-da83-47ae-bebc-55d361c1cf63', 'Chai', 1, true, 44100, 60000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('04e984af-7991-482b-87ff-66737eac8289', '571ae329-da83-47ae-bebc-55d361c1cf63', '0924', '2027-09-01', 0, 44100);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('7183c1a3-3665-433c-a590-f509940b1cf5', '571ae329-da83-47ae-bebc-55d361c1cf63', '12/2025', '2028-12-30', 0, 44100);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('5325fcb5-5044-4f30-8dc9-8f5267facfb9', '571ae329-da83-47ae-bebc-55d361c1cf63', '01/2026', '2029-01-30', 3, 44100);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('90b4c873-70c2-41d3-bdc6-822b4081ef4f', '6afa32c5-1630-49f2-9d0f-06168b96b389', 'SP000844', '8936036961287', 'Rhomatic gel', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('cbb6e182-483e-4275-b695-8879d9447c83', '90b4c873-70c2-41d3-bdc6-822b4081ef4f', 'Tuýp', 1, true, 20700, 25000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('c80299e0-edaa-4e28-8e8b-53f52cf03971', '90b4c873-70c2-41d3-bdc6-822b4081ef4f', '361024', '2028-10-22', 11, 20700);
INSERT INTO public.products (id, category_id, product_code, name, is_active, is_direct_sale) 
                        VALUES ('d3581860-3338-4a43-a70b-71fa47e6684b', '6afa32c5-1630-49f2-9d0f-06168b96b389', 'PARENT_SALONPAS', 'Salonpas', true, false);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('2ce32b21-28a6-4b3e-bb28-1a8823c57618', '6afa32c5-1630-49f2-9d0f-06168b96b389', 'SP000843', '8935106241113', 'Salonpas Gel', true, 'd3581860-3338-4a43-a70b-71fa47e6684b', 'Gel');
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('3de6d474-094f-4e87-b89e-49bfdf2ef64b', '2ce32b21-28a6-4b3e-bb28-1a8823c57618', 'Tuýp', 1, true, 41300, 46000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('66a1bdc3-a416-4a9d-8c7c-63ac2e7bb674', '2ce32b21-28a6-4b3e-bb28-1a8823c57618', '2442', '2027-12-26', 0, 41300);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('c3677aea-b27a-466f-ad4e-b74a78367099', '2ce32b21-28a6-4b3e-bb28-1a8823c57618', '9021', '2028-06-10', 12, 41300);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('136abb2a-3a37-4d07-8924-5cf84863fc72', '2ce32b21-28a6-4b3e-bb28-1a8823c57618', '0', '2029-02-26', 0, 41300);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('9f164448-041e-4b9b-b693-6899252224ac', '6afa32c5-1630-49f2-9d0f-06168b96b389', 'SP000840', '8934935012284', 'Cao Bạch Hổ', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('f7b2372b-c9fa-4b77-9c50-bf330d4ed9de', '9f164448-041e-4b9b-b693-6899252224ac', 'Lọ', 1, true, 24300, 30000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('3df69d7a-d4ec-4251-936f-be234d6fdc51', '9f164448-041e-4b9b-b693-6899252224ac', '0', '2027-01-01', 0, 24300);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('9b80f72b-7fca-42fa-9008-64121a0c9fb7', '9f164448-041e-4b9b-b693-6899252224ac', 'BH030525', '2027-11-01', 0, 24300);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('1bdcee7c-9819-4981-ba7d-adf61b08ee88', '9f164448-041e-4b9b-b693-6899252224ac', 'bh010126', '2028-07-31', 4, 24300);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('17243ccc-dd2d-43c9-8888-02e6e815a8e0', '6afa32c5-1630-49f2-9d0f-06168b96b389', 'SP000839', '8935269929835', 'Kem bôi da Trisula', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('a8d5f54e-c090-4bc4-9811-6e79bc8acf68', '17243ccc-dd2d-43c9-8888-02e6e815a8e0', 'Tuýp', 1, true, 20000, 25000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('4c92a77f-9d2e-4b5f-bb21-92a335c9593b', '17243ccc-dd2d-43c9-8888-02e6e815a8e0', '410137', '2027-09-29', 1, 20000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('6ca04909-5f14-46f8-9f59-7d7de6e0778a', '6afa32c5-1630-49f2-9d0f-06168b96b389', 'SP000838', NULL, 'Derma ultra', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('6c9a36cf-4f08-4e78-81b6-22ec0e2d8be0', '6ca04909-5f14-46f8-9f59-7d7de6e0778a', 'Tuýp', 1, true, 40000, 120000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('46468959-b918-47e0-a380-ecf7fb82bec3', '6ca04909-5f14-46f8-9f59-7d7de6e0778a', '0309', '2027-09-10', 4, 40000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('b617bd31-0383-4fbf-9830-f4ad06c18d36', '6afa32c5-1630-49f2-9d0f-06168b96b389', 'SP000837', '8938540796546', 'Gel trị sẹo Anscar Ultra', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('77e61d2c-040c-4514-8d2e-794c73eead99', 'b617bd31-0383-4fbf-9830-f4ad06c18d36', 'Tuýp', 1, true, 150000, 200000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('dcbbad71-1d8b-47f2-aad8-75eb83e00da1', 'b617bd31-0383-4fbf-9830-f4ad06c18d36', '230724', '2027-07-22', 7, 150000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('b0e7df9d-6ece-46bb-bf0c-d356973cc00f', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000836', '8934940010107', 'Dibetalic', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('8ad07b0c-7264-4ae1-9c31-78eea4c3adb7', 'b0e7df9d-6ece-46bb-bf0c-d356973cc00f', 'Tuýp', 1, true, 18000, 20000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('f792250d-b329-4c87-b92f-47a9b80a53a1', 'b0e7df9d-6ece-46bb-bf0c-d356973cc00f', '9623', '2025-12-01', 0, 18000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('af8814e6-b06b-4eb6-83c5-17487a998dc8', 'b0e7df9d-6ece-46bb-bf0c-d356973cc00f', '2825', '2027-05-15', 0, 18000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('f9b453f0-1a77-41e6-84ec-4c9eefa6b8aa', 'b0e7df9d-6ece-46bb-bf0c-d356973cc00f', '8025', '2027-11-26', 9, 18000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('1b755726-f7aa-4599-ae40-9209745d3d6b', '6afa32c5-1630-49f2-9d0f-06168b96b389', 'SP000835', '8934567086110', 'Dầu nóng mặt trời opc nhỏ', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('a057263f-0318-449f-9c1e-f46ba420fb34', '1b755726-f7aa-4599-ae40-9209745d3d6b', 'Chai', 1, true, 38000, 45000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('a9483f72-8e7b-47f5-99dc-1c8d437f224f', '1b755726-f7aa-4599-ae40-9209745d3d6b', '24012', '2027-01-18', 8, 38000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('7d0446a7-e5e1-422d-b3e6-8f826b4051c7', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000833', '8936085360963', 'Cadirovid', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('9c7d9fae-0f87-41c3-a91c-ce832a6fb171', '7d0446a7-e5e1-422d-b3e6-8f826b4051c7', 'Tuýp', 1, true, 6000, 10000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('563ba11d-d25e-469b-9dd9-271480cefd06', '7d0446a7-e5e1-422d-b3e6-8f826b4051c7', '040824', '2027-08-15', 29, 6000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('864ebe2b-05c5-41ec-8e0a-8ba1b56bfe51', '6afa32c5-1630-49f2-9d0f-06168b96b389', 'SP000832', NULL, 'Fucicort bôi', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('6ca81534-4f1f-469a-a36e-4de9f1aa8f35', '864ebe2b-05c5-41ec-8e0a-8ba1b56bfe51', 'Tuýp', 1, true, 102000, 115000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('76273599-e206-498f-a9e1-1e51e8ba106f', '864ebe2b-05c5-41ec-8e0a-8ba1b56bfe51', 'C99914', '2026-05-12', 0, 102000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('56b72ae0-c156-4d5a-b636-bedc28a8443a', '864ebe2b-05c5-41ec-8e0a-8ba1b56bfe51', 'D27675', '2027-10-03', 1, 102000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('b913135e-49f2-4860-a00c-608b8877d7cc', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000831', '8938523488109', 'Cronazol', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('b317eae1-6727-4add-a559-a041642cf046', 'b913135e-49f2-4860-a00c-608b8877d7cc', 'Tuýp', 1, true, 45600, 50000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('9bd0a3d2-16a9-4200-86fd-cb5e73ccd0ad', 'b913135e-49f2-4860-a00c-608b8877d7cc', '030425', '2028-04-03', 0, 45600);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('6c15fdc4-ecd2-4c09-9b7c-b4383f5ed848', 'b913135e-49f2-4860-a00c-608b8877d7cc', '0', '2028-04-10', 8, 45600);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('f9d1fbb0-7061-4e7c-94cb-58541fcd3938', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000830', '8936098966060', 'Bôi Clingel', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('ff456f35-0940-4c65-9b18-57c0ac960302', 'f9d1fbb0-7061-4e7c-94cb-58541fcd3938', 'Tuýp', 1, true, 50000, 75000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('7f327d51-fc7f-4987-88b4-e38ace91b1fc', 'f9d1fbb0-7061-4e7c-94cb-58541fcd3938', '503', '2027-08-04', 13, 50000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('4d3a19d2-4f53-43a5-8d96-a7c0382906af', '6afa32c5-1630-49f2-9d0f-06168b96b389', 'SP000829', NULL, 'Corti RVN', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('4341c92d-98ab-4c25-83c0-6af5bdcbdf8e', '4d3a19d2-4f53-43a5-8d96-a7c0382906af', 'Chai', 1, true, 16640, 22000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('c3193451-166f-41a4-bcf9-0a440ce870ef', '4d3a19d2-4f53-43a5-8d96-a7c0382906af', '0070824', '2026-08-06', 0, 16640);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('43c652b8-3944-4179-842e-12137ab44f3b', '4d3a19d2-4f53-43a5-8d96-a7c0382906af', '0131224', '2026-12-02', 8, 16640);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('ca14dac7-5319-406a-8c16-c93ca52ff527', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000828', '8936065621046', 'Tezkin 10g', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('e0a95b39-5084-49bb-bc46-45917b50901d', 'ca14dac7-5319-406a-8c16-c93ca52ff527', 'Tuýp', 1, true, 21500, 30000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('eb43cad9-df1f-4b23-8143-ff6a75e47fbe', 'ca14dac7-5319-406a-8c16-c93ca52ff527', '209', '2026-12-23', 5, 21500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('e2b905b0-0d9b-4bbc-91c9-ed9a61a958d5', '6afa32c5-1630-49f2-9d0f-06168b96b389', 'SP000827', '8938510417037', 'Cortibido bidopharma', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('81aafd16-79e9-4cae-8469-5df778772123', 'e2b905b0-0d9b-4bbc-91c9-ed9a61a958d5', 'Chai', 1, true, 9000, 12000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('019ecf51-2adc-4aaf-ac66-04b02448bb36', 'e2b905b0-0d9b-4bbc-91c9-ed9a61a958d5', '010624', '2027-06-03', 0, 9000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('78d665e0-7e0c-4d31-aa8f-a6bd77b94f89', 'e2b905b0-0d9b-4bbc-91c9-ed9a61a958d5', '050126', '2029-01-29', 17, 9000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('69f1859a-8fb2-4b26-9ba3-e49220ae222b', '6afa32c5-1630-49f2-9d0f-06168b96b389', 'SP000826', '8935006530935', 'Remos ib', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('88d46704-1e9b-41ec-ae9f-bd6d6d084ba6', '69f1859a-8fb2-4b26-9ba3-e49220ae222b', 'Tuýp', 1, true, 51000, 55000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('39f5c9c7-91dd-40cb-927a-04cbf9c2e758', '69f1859a-8fb2-4b26-9ba3-e49220ae222b', '2', '2028-01-01', 0, 51000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('b894c5c0-82ae-4080-9f00-1c736d84cf25', '69f1859a-8fb2-4b26-9ba3-e49220ae222b', 'jb01', '2028-10-14', 0, 51000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('4311c37a-3946-41fa-a597-722bcd74bfcf', '69f1859a-8fb2-4b26-9ba3-e49220ae222b', 'DC01', '2029-04-09', 5, 51000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('f4bbe9d2-17d3-42e1-8d44-4262ad5d316d', '6afa32c5-1630-49f2-9d0f-06168b96b389', 'SP000825', '8936027003224', 'Enoti kem', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('6cbab7f9-3034-4a78-83a2-efd0dfa1c8b2', 'f4bbe9d2-17d3-42e1-8d44-4262ad5d316d', 'Tuýp', 1, true, 20000, 25000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('9e2a1d85-5620-4301-9403-5550fc229047', 'f4bbe9d2-17d3-42e1-8d44-4262ad5d316d', '24003', '2027-10-29', 2, 20000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('1899852a-f3f3-4d68-9be0-369ca476be73', '6afa32c5-1630-49f2-9d0f-06168b96b389', 'SP000824', '8850109051418', 'Ống hít', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('94c95d0a-2d5f-4be2-8bbf-789607c1889a', '1899852a-f3f3-4d68-9be0-369ca476be73', 'Ống', 1, true, 9680, 12000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('67bb992f-43fe-4dec-adbf-42344e1217b3', '1899852a-f3f3-4d68-9be0-369ca476be73', '220326G', '2027-09-11', 0, 9680);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('980f1cf6-77f2-42cb-b3a7-76114e698b10', '1899852a-f3f3-4d68-9be0-369ca476be73', '061224', '2029-12-31', 0, 9680);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('4f77da29-0fc3-4d63-b0be-2b9125d47283', '1899852a-f3f3-4d68-9be0-369ca476be73', '101224', '2029-12-31', 12, 9680);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('b7a0b89b-71fe-47a6-bf44-e22e293cec49', '6afa32c5-1630-49f2-9d0f-06168b96b389', 'SP000821', NULL, 'Dầu nóng Trường Sơn', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('64c5a2af-e1c5-4337-9221-d3968f8873ed', 'b7a0b89b-71fe-47a6-bf44-e22e293cec49', 'Chai', 1, true, 25000, 30000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('03e0bdd0-d29f-4931-83ec-e6ea61c58f1d', 'b7a0b89b-71fe-47a6-bf44-e22e293cec49', '011124', '2027-11-06', 8, 25000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('06e8f408-9924-4ac1-9b8a-1ff2376557e1', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000820', '8938501089670', 'Sihiron', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('07555ec8-f1e4-4427-aa73-b1ca5c518897', '06e8f408-9924-4ac1-9b8a-1ff2376557e1', 'Tuýp', 1, true, 6050, 10000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('57a768f3-a832-4704-b44c-3304e30ad75b', '06e8f408-9924-4ac1-9b8a-1ff2376557e1', '70425', '2028-04-10', 63, 6050);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('cc99b2b6-9253-4b65-8fc0-0fbf64f2dd96', '6afa32c5-1630-49f2-9d0f-06168b96b389', 'SP000819', '8938505132143', 'Dầu phật linh 5ml lớn', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('cda3f62f-e87d-4c51-a0e2-3121bef4e855', 'cc99b2b6-9253-4b65-8fc0-0fbf64f2dd96', 'Chai', 1, true, 16450, 19000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('3e9ce919-39ff-4507-b07c-18a0a7943265', 'cc99b2b6-9253-4b65-8fc0-0fbf64f2dd96', '021224', '2027-12-23', 9, 16450);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('6bc1ef40-714d-456e-94c8-b6c78b5fca0c', '6afa32c5-1630-49f2-9d0f-06168b96b389', 'SP000818', '8934567001557', 'Dầu nóng mặt trời opc lớn', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('b7784d38-167f-4a41-9a94-54680fedda4e', '6bc1ef40-714d-456e-94c8-b6c78b5fca0c', 'Chai', 1, true, 62300, 67000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('748fed65-2a20-4edc-b868-a4739d72b934', '6bc1ef40-714d-456e-94c8-b6c78b5fca0c', '25004', '2028-02-11', 0, 62300);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('ab906215-8f29-4a3e-a8f5-aa0da17fbc80', '6bc1ef40-714d-456e-94c8-b6c78b5fca0c', '25016', '2028-12-11', 4, 62300);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('583b156d-b3a6-44a4-81d8-5ba52a2e42e5', '6afa32c5-1630-49f2-9d0f-06168b96b389', 'SP000817', '8936018670152', 'Antanazol', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('a46165bd-d7a9-4665-97ad-2b76e32fa79f', '583b156d-b3a6-44a4-81d8-5ba52a2e42e5', 'Tuýp', 1, true, 9000, 20000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('4080b0f4-0db2-43c7-bf8c-43d6d453b4d2', '583b156d-b3a6-44a4-81d8-5ba52a2e42e5', '5002', '2028-02-05', 0, 9000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('3b7a065a-b20e-46bb-a28c-01bb843124d4', '583b156d-b3a6-44a4-81d8-5ba52a2e42e5', '0', '2028-05-14', 30, 9000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('22a218b2-ac17-4f9f-8f9a-8b84d6fa31af', '6afa32c5-1630-49f2-9d0f-06168b96b389', 'SP000816', NULL, 'Bosgyno', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('dd607da4-4cf4-404c-b0b6-6636a066da61', '22a218b2-ac17-4f9f-8f9a-8b84d6fa31af', 'Tuýp', 1, true, 11900, 15000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('6fcb9dad-57a5-465f-9a8b-3b396f1d98ce', '22a218b2-ac17-4f9f-8f9a-8b84d6fa31af', '020324', '2027-03-26', 13, 11900);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('a31e7fd1-f0ff-4d85-8317-a26ab3d7655d', '6afa32c5-1630-49f2-9d0f-06168b96b389', 'SP000815', '8936018670169', 'Gentri-sone', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('5440583f-4bf0-4932-9382-5369e4ebe3b6', 'a31e7fd1-f0ff-4d85-8317-a26ab3d7655d', 'Tuýp', 1, true, 13500, 17000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('2c7593f7-4fd1-463a-a3c7-722720dbeebb', 'a31e7fd1-f0ff-4d85-8317-a26ab3d7655d', '4049', '2027-05-22', 0, 13500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('f7176d1b-18b3-410c-9d81-c53a3ad267b0', 'a31e7fd1-f0ff-4d85-8317-a26ab3d7655d', '0', '2028-07-13', 13, 13500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('4e0c86e0-a21a-4a97-9b3b-8845042f2f71', '6afa32c5-1630-49f2-9d0f-06168b96b389', 'SP000814', '8936007201077', 'Dầu gừng Thái Dương 24ml', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('4e2770b0-9a18-4d47-914c-331e299d993f', '4e0c86e0-a21a-4a97-9b3b-8845042f2f71', 'Chai', 1, true, 70200, 80000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('7ab86ef8-664b-4da5-b1e8-ad64c000e5bc', '4e0c86e0-a21a-4a97-9b3b-8845042f2f71', '0030125', '2030-01-14', 0, 70200);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('e9e602e3-5466-4f07-a808-414ee0e23610', '4e0c86e0-a21a-4a97-9b3b-8845042f2f71', '0', '2030-07-04', 0, 70200);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('3327589e-ad8a-4aae-82ca-0f2e80f52c8a', '4e0c86e0-a21a-4a97-9b3b-8845042f2f71', '0131025', '2030-10-25', 5, 70200);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('3866cdfd-d2ee-4054-ad39-d5d6778bec5e', '6afa32c5-1630-49f2-9d0f-06168b96b389', 'SP000812', '8934574200042', 'Dầu khuynh diệp mekophar', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('f4127d55-811c-429e-8159-ed36c612dade', '3866cdfd-d2ee-4054-ad39-d5d6778bec5e', 'Chai', 1, true, 56100, 65000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('d2d13634-6c5a-42b3-85a1-3fedac65a48f', '3866cdfd-d2ee-4054-ad39-d5d6778bec5e', '23017EN', '2026-12-03', 3, 56100);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('219128de-2faf-4546-ab7d-ce5ea07da4ab', '6afa32c5-1630-49f2-9d0f-06168b96b389', 'SP000811', '8934567003483', 'Dầu khuynh diệp opc 25ml', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('8d211e6a-842c-492e-8e71-86c5f262c757', '219128de-2faf-4546-ab7d-ce5ea07da4ab', 'Chai', 1, true, 72700, 78000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('8d2b0e7d-d1ed-4009-832b-430cc7e089d1', '219128de-2faf-4546-ab7d-ce5ea07da4ab', '23064', '2026-12-21', 0, 72700);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('18355a7d-6f4f-4ea5-b6b1-07b75391e553', '219128de-2faf-4546-ab7d-ce5ea07da4ab', '0', '2028-06-05', 1, 72700);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('f3f2e316-3969-4e8b-bfa5-794944849a21', '6afa32c5-1630-49f2-9d0f-06168b96b389', 'SP000810', '8938505132037', 'Dầu Gió Trường Sơn', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('f7b37e27-6435-40f6-82dc-f27385de4269', 'f3f2e316-3969-4e8b-bfa5-794944849a21', 'Chai', 1, true, 8000, 15000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('6eaf5c74-16ff-44ca-9556-c894ceea9478', 'f3f2e316-3969-4e8b-bfa5-794944849a21', '011224', '2027-12-13', 18, 8000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('3651485c-5295-4b22-a6ae-4b50341d6f45', '6afa32c5-1630-49f2-9d0f-06168b96b389', 'SP000809', '8888951886124', 'Dầu Eagle brand medicated oil Trắng', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('9a9258e7-fc44-40d0-9290-b9262cdd662c', '3651485c-5295-4b22-a6ae-4b50341d6f45', 'Chai', 1, true, 105000, 120000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('a93ccd35-005c-496b-b556-2da49ebcd797', '3651485c-5295-4b22-a6ae-4b50341d6f45', '0', '2029-02-01', 2, 105000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('dfb3f815-bd9a-4511-929f-bf95985130c4', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP000807', '8936178750244', 'Vitamin 3B', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('bf894547-a620-4ea6-94ed-2ac692d2bac6', 'dfb3f815-bd9a-4511-929f-bf95985130c4', 'Viên', 1, true, 400, 1000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('c62dbf9c-a153-4dcf-b62a-26f2fd1eb5bc', 'dfb3f815-bd9a-4511-929f-bf95985130c4', '0', '2025-12-05', 0, 400);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('353e25d1-6d0e-4bdd-8ea0-d4c09bce414d', 'dfb3f815-bd9a-4511-929f-bf95985130c4', '010124', '2027-01-18', 0, 400);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('faa4de38-ad6a-49f3-955d-6b2ddf887ff2', 'dfb3f815-bd9a-4511-929f-bf95985130c4', '0', '2028-01-01', 620, 400);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('82688fa3-162f-4d5e-9a1f-fe0540ffcdc2', '32ed068b-bf63-4242-8f32-d4bde6b3956a', 'SP000804', '8935069601061', 'Thuốc mỡ tetracyclin 1%', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('629266fb-9d09-4d25-b9b1-1cc2001d48f4', '82688fa3-162f-4d5e-9a1f-fe0540ffcdc2', 'Tuýp', 1, true, 4530, 8000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('ba334f7c-d7ed-4670-99e8-7b1fa9778f95', '82688fa3-162f-4d5e-9a1f-fe0540ffcdc2', '4824', '2027-07-08', 0, 4530);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('d0bc028a-184f-4e80-9ffd-e33ef74fbbbb', '82688fa3-162f-4d5e-9a1f-fe0540ffcdc2', '0826', '2029-02-23', 55, 4530);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('17ba443b-f560-4323-a100-d505857bd0b6', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000803', '8936098962437', 'Ketofen-drop 5ml', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('4a0a4af8-c334-4f6e-a137-ccf28a483fb4', '17ba443b-f560-4323-a100-d505857bd0b6', 'Chai', 1, true, 30000, 40000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('fbb547f1-69f7-408a-87a9-4c69b560434c', '17ba443b-f560-4323-a100-d505857bd0b6', '010124', '2026-01-19', 0, 30000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('079646c3-3740-45b6-ba8b-76017b42ed71', '17ba443b-f560-4323-a100-d505857bd0b6', '011124', '2026-11-29', 12, 30000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('195977db-8842-4cbb-9fb6-093e26293184', '290d7875-db14-4fae-9b9e-7413022816c8', 'SP000802', NULL, 'Refresh Tears', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('816783dc-33e3-4b95-8f1b-e990dc46e3c5', '195977db-8842-4cbb-9fb6-093e26293184', 'Chai', 1, true, 79000, 82000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('b36254f1-55a5-4fe4-afc0-3e304ae18de5', '195977db-8842-4cbb-9fb6-093e26293184', '409842', '2026-05-29', 1, 79000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('6c355fd9-eef3-4eca-b9f4-b3569260dd1f', '290d7875-db14-4fae-9b9e-7413022816c8', 'SP000800', '4987084556165', 'Sanlein 0,1%', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('d2c14c80-d936-4f34-a18c-9b95e6461978', '6c355fd9-eef3-4eca-b9f4-b3569260dd1f', 'Chai', 1, true, 64300, 70000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('0ca18303-ad39-4965-b9a4-386de16a9407', '6c355fd9-eef3-4eca-b9f4-b3569260dd1f', '1HT8019', '2027-10-06', 2, 64300);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('0c0f2cf7-db42-48d1-8bcb-63e9cdac4bf8', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000798', '8936034560437', 'Osla 15ml', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('cfa96e5a-2016-41db-89a4-9ed0cd6a04c3', '0c0f2cf7-db42-48d1-8bcb-63e9cdac4bf8', 'Chai', 1, true, 20700, 23000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('38ee927f-2753-4c12-95a0-50cec64fda0c', '0c0f2cf7-db42-48d1-8bcb-63e9cdac4bf8', '0120225', '2027-02-17', 0, 20700);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('b893c5c0-27f8-4073-af82-84f03b323816', '0c0f2cf7-db42-48d1-8bcb-63e9cdac4bf8', '0230325', '2027-03-12', 0, 20700);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('baebb0e5-e826-4999-9260-879f2b83d6c9', '0c0f2cf7-db42-48d1-8bcb-63e9cdac4bf8', '1021025', '2027-10-22', 0, 20700);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('f7672366-feef-4cc1-bab2-52f86add8ac7', '0c0f2cf7-db42-48d1-8bcb-63e9cdac4bf8', '1181125', '2027-11-28', 0, 20700);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('c959663c-eb51-41f3-b5d7-02df360a9a84', '0c0f2cf7-db42-48d1-8bcb-63e9cdac4bf8', '1211225', '2027-11-30', 16, 20700);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('1286ca5f-dbfc-4002-ab7c-6bf02f129b9d', '290d7875-db14-4fae-9b9e-7413022816c8', 'SP000796', '4987084559166', 'Flumetholon 0.1%', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('e7638213-d068-477c-b437-468531450245', '1286ca5f-dbfc-4002-ab7c-6bf02f129b9d', 'Chai', 1, true, 33200, 37000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('52a8ba06-41c8-40c3-9318-6bc288bb8ea6', '1286ca5f-dbfc-4002-ab7c-6bf02f129b9d', '1FM6845', '2026-12-03', 0, 33200);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('e36d8ee8-9276-4bcf-ab84-df42f52b2e8b', '1286ca5f-dbfc-4002-ab7c-6bf02f129b9d', '1FM7039', '2028-03-09', 1, 33200);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('19f2d38f-26d4-4d9e-8053-8ec4f6c6260b', '1286ca5f-dbfc-4002-ab7c-6bf02f129b9d', '1FM7098', '2028-07-21', 10, 33200);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('b5c8bfe4-eea7-4816-b608-07a125f0ce24', '290d7875-db14-4fae-9b9e-7413022816c8', 'SP000795', '8936058823334', 'Eskar tears', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('b7e56646-f820-4ffe-82f6-e7692b4d1fa1', 'b5c8bfe4-eea7-4816-b608-07a125f0ce24', 'Chai', 1, true, 26100, 40000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('f3a5746d-cfff-412f-979e-81ac8756d54f', 'b5c8bfe4-eea7-4816-b608-07a125f0ce24', '0010624', '2027-06-18', 0, 26100);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('d9635ac8-bbee-4581-bebd-19b688b64e20', 'b5c8bfe4-eea7-4816-b608-07a125f0ce24', '0', '2028-07-15', 0, 26100);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('87f6bd2e-0e24-4e60-a731-e035e9375629', 'b5c8bfe4-eea7-4816-b608-07a125f0ce24', '1030125', '2028-10-03', 24, 26100);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('a82e5fb7-430c-4ab9-baab-af5b970db343', '290d7875-db14-4fae-9b9e-7413022816c8', 'SP000794', '8936058820166', 'Estobra 0.3%', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('29cab204-d0c8-4b9b-b7a0-1353200089a8', 'a82e5fb7-430c-4ab9-baab-af5b970db343', 'Chai', 1, true, 11700, 15000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('dcf1bd1a-7839-4b47-8ed2-0874c4d4d6e5', 'a82e5fb7-430c-4ab9-baab-af5b970db343', '0060924', '2026-09-16', 0, 11700);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('347e146b-8743-4cb4-8f51-d4ebab191af3', 'a82e5fb7-430c-4ab9-baab-af5b970db343', '1210125', '2027-01-21', 28, 11700);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('03455e45-4493-4617-a3fb-764a13a34bf1', '290d7875-db14-4fae-9b9e-7413022816c8', 'SP000793', '8934690011485', 'Eyetamin', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('cca0bf4b-8489-4e18-991c-9bb798ce8ddb', '03455e45-4493-4617-a3fb-764a13a34bf1', 'Chai', 1, true, 18500, 22000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('54ce9924-8618-49c4-8cb0-241e0100a0b9', '03455e45-4493-4617-a3fb-764a13a34bf1', '24008', '2027-08-21', 0, 18500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('532c7b62-a04f-42f8-9cec-ffb1bacd227a', '03455e45-4493-4617-a3fb-764a13a34bf1', '25007', '2028-11-07', 0, 18500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('6b00d59d-71af-4c06-9183-a34f09da9047', '03455e45-4493-4617-a3fb-764a13a34bf1', '26002', '2029-02-01', 27, 18500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('eb3e90bd-c086-47a1-a3cc-0fc9c5b97d0f', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP000791', '8936123411329', 'Pharmaton energy', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('dac87842-add6-489d-904b-18ce4cefc5f0', 'eb3e90bd-c086-47a1-a3cc-0fc9c5b97d0f', 'Viên', 1, true, 0, 8000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('a67ee59f-19d5-422f-964b-f39aea4c4a77', 'eb3e90bd-c086-47a1-a3cc-0fc9c5b97d0f', '7794901', '2026-09-30', 0, 0);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('3f78485d-d3e9-4378-bb9b-4a46b97be063', 'eb3e90bd-c086-47a1-a3cc-0fc9c5b97d0f', 'AR5630', '2027-08-31', 0, 0);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('5c784bb6-1eca-4dce-9d12-f713afd317d4', 'eb3e90bd-c086-47a1-a3cc-0fc9c5b97d0f', 'AR5676', '2027-10-31', 0, 0);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('22bf9622-1e00-45bf-b3f2-0151b5b35a79', 'eb3e90bd-c086-47a1-a3cc-0fc9c5b97d0f', 'AR568L', '2027-10-31', 68, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('7f3428f0-a78b-45d5-b864-d6b6cf92c555', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP0007890', '8935131204831', 'Rutin C', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('e1508ac2-5639-43d1-a7df-bc72b2682d1f', '7f3428f0-a78b-45d5-b864-d6b6cf92c555', 'viên', 1, true, 3300, 500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('cbcb96c3-63bd-43d5-ad6b-a3f11337f317', '7f3428f0-a78b-45d5-b864-d6b6cf92c555', '038', '2027-01-21', 0, 3300);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('d51db843-cca1-46f7-acc4-a3bba5ad1950', '7f3428f0-a78b-45d5-b864-d6b6cf92c555', '0325', '2028-08-29', 1076, 3300);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d0d3aadc-d231-45ea-bcc1-712235bfef63', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP000787', '8936116250539', 'Calci D3-mdp 5K', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('79608201-27fe-4eb4-9f9a-a1ef7e0c9a04', 'd0d3aadc-d231-45ea-bcc1-712235bfef63', 'Viên', 1, true, 0, 500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('a1a43f99-6e67-4c49-9533-41c9f2f82bcd', 'd0d3aadc-d231-45ea-bcc1-712235bfef63', '010225', '2028-02-25', 380, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('b8f1f129-d4d6-41ca-a02a-7b28bb024e42', '290d7875-db14-4fae-9b9e-7413022816c8', 'SP000786', NULL, 'Sancoba', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('2dfa5c3c-6343-472a-9276-2fb797f8327f', 'b8f1f129-d4d6-41ca-a02a-7b28bb024e42', 'Chai', 1, true, 59700, 65000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('bee0106a-d27e-42f6-91f1-b025b4cefb16', 'b8f1f129-d4d6-41ca-a02a-7b28bb024e42', 'SK4446', '2027-06-04', 0, 59700);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('669d1969-3cc9-4e93-8624-25791d4d1e20', 'b8f1f129-d4d6-41ca-a02a-7b28bb024e42', 'SK5025', '2028-03-27', 3, 59700);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('7800321d-09c1-4a1e-8f2c-2354c17fa3eb', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000785', NULL, 'Thuốc nhỏ mắt posod', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('6726068e-2b50-4bf2-896b-ea8bbd64a340', '7800321d-09c1-4a1e-8f2c-2354c17fa3eb', 'Chai', 1, true, 0, 45000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('06a07f16-8245-48a9-b050-911c0b479521', '7800321d-09c1-4a1e-8f2c-2354c17fa3eb', 'EEY501', '2027-05-17', 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('642e49ac-ae03-40ed-a751-024a36d24bf5', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP000783', '8936206260264', 'Viên giấp cá Thông Tọa', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('6963ef80-9308-40d1-b8b2-3bf50844bb9c', '642e49ac-ae03-40ed-a751-024a36d24bf5', 'Vỉ', 1, true, 0, 35000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('2e5c9b92-212c-435a-95f2-d3c3d7b9a97d', '642e49ac-ae03-40ed-a751-024a36d24bf5', '010324', '2027-03-25', 18, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('c8356cf4-ba27-4f30-a777-87dac84f3f2c', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP000781', '8938528512090', 'Calci 50k vỉ', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('8bbf60a6-d000-4474-bfaf-a4f4b0c6845b', 'c8356cf4-ba27-4f30-a777-87dac84f3f2c', 'Vỉ', 1, true, 0, 50000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('90fe06c8-9cd5-4bfa-83f9-5d0d9af2f2a6', 'c8356cf4-ba27-4f30-a777-87dac84f3f2c', '0', '2028-02-09', 0, 0);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('5dab02d8-7c21-49c5-84ee-42e8f4d6a040', 'c8356cf4-ba27-4f30-a777-87dac84f3f2c', '010325', '2028-03-01', 0, 0);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('e7604033-c6f5-4193-8947-8334e2c02bf4', 'c8356cf4-ba27-4f30-a777-87dac84f3f2c', '010825', '2028-08-06', 0, 0);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('32741912-f77d-48b7-8181-4e28a2ad0ac3', 'c8356cf4-ba27-4f30-a777-87dac84f3f2c', '041225', '2028-12-30', 320, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('053320b3-3190-49f1-aeee-180078587d8b', '6afa32c5-1630-49f2-9d0f-06168b96b389', 'SP000780', '8936034560505', 'Xisat Hồng', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('2cdc4288-09ac-4d9d-bfbd-6c88e03c6f6b', '053320b3-3190-49f1-aeee-180078587d8b', 'Chai', 1, true, 30000, 32000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('5c044076-d7b7-48a9-9546-86f34f67605d', '053320b3-3190-49f1-aeee-180078587d8b', '0301224', '2027-12-23', 0, 30000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('9741772d-4788-40f8-ac22-285339f0eb44', '053320b3-3190-49f1-aeee-180078587d8b', '0221025', '2028-10-21', 6, 30000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('831ff61d-2703-474f-b36f-788cba5f75a3', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000779', '8936058823006', 'Neo beta lọ 8ml', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('fd638def-ff7f-42da-a8ff-a5fcc420bf00', '831ff61d-2703-474f-b36f-788cba5f75a3', 'Chai', 1, true, 0, 25000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('bddac996-94f7-48c2-bc7f-8453e95c0b6f', '831ff61d-2703-474f-b36f-788cba5f75a3', '1090125', '2027-01-09', 0, 0);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('102f9b92-84c1-40ee-83c3-510d8b1ab019', '831ff61d-2703-474f-b36f-788cba5f75a3', '0', '2027-06-04', 7, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('ec9a810b-be10-4c14-ba21-381f0c404a31', '6afa32c5-1630-49f2-9d0f-06168b96b389', 'SP000778', '8936034560512', 'Xisat daily 75ml', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('73afe426-2dad-44dd-b896-1d0a295796da', 'ec9a810b-be10-4c14-ba21-381f0c404a31', 'Chai', 1, true, 28180, 32000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('da4dcddb-9397-4f37-98ff-484c8fb35056', 'ec9a810b-be10-4c14-ba21-381f0c404a31', '0050225', '2028-02-24', 0, 28180);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('21767660-139b-4cff-9bba-6655a9eb4094', 'ec9a810b-be10-4c14-ba21-381f0c404a31', '0110525', '2028-05-20', 0, 28180);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('a8ecd8e0-b6bd-49f0-8140-64c4de09cdc0', 'ec9a810b-be10-4c14-ba21-381f0c404a31', '0291125', '2028-11-06', 0, 28180);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('44dc09c6-563e-4076-8db5-3a2372e2c2f0', 'ec9a810b-be10-4c14-ba21-381f0c404a31', '0311125', '2028-11-19', 5, 28180);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('6879b3ec-5c6e-4d66-900d-560d6ef10a92', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000777', '8936058820111', 'Thuốc nhỏ mắt pandex Dk Pharma điều trị viêm mắt', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('346c3fe0-1e56-44a8-ac45-9e40aa04c7db', '6879b3ec-5c6e-4d66-900d-560d6ef10a92', 'Chai', 1, true, 0, 25000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('08805642-5a5a-48ef-ad45-dca69e9c5e5c', '6879b3ec-5c6e-4d66-900d-560d6ef10a92', '0150924', '2026-09-25', 0, 0);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('f0119108-628c-4ae6-8e72-cc6e78a1e98b', '6879b3ec-5c6e-4d66-900d-560d6ef10a92', '1011125', '2027-11-01', 28, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('0102a344-494a-4cac-aea4-5540ef01f565', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000776', NULL, 'Polydeson', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('91b60915-6803-4c35-9fa6-a9cf21fe3938', '0102a344-494a-4cac-aea4-5540ef01f565', 'Chai', 1, true, 0, 10000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('54f2b5ef-2cd3-4660-9afd-31d5f28e4536', '0102a344-494a-4cac-aea4-5540ef01f565', '701124', '2026-11-11', 2, 0);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('83cc3524-4b62-4d83-b968-9a626af3be4f', '0102a344-494a-4cac-aea4-5540ef01f565', '200326', '2028-03-19', 20, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('fd26b917-3014-4c8c-9858-b8e9cd37c708', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000774', NULL, 'Vinpharton', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('071e6003-585c-4c29-a369-6903d6ce2efc', 'fd26b917-3014-4c8c-9858-b8e9cd37c708', 'Viên', 1, true, 0, 5000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('ca607fac-cc90-45be-a2bb-fbde08d6a9b6', 'fd26b917-3014-4c8c-9858-b8e9cd37c708', '010423', '2026-04-10', 0, 0);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('b0c42139-7a9f-46b4-b7f7-d537bf9c7a37', 'fd26b917-3014-4c8c-9858-b8e9cd37c708', '010225', '2028-02-08', 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('f3d81792-9651-4708-a2eb-00247375ac58', '290d7875-db14-4fae-9b9e-7413022816c8', 'SP000773', '01635815', 'TobraDex', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('2c067216-cfaa-45f8-8d08-1b8df22cde0b', 'f3d81792-9651-4708-a2eb-00247375ac58', 'Chai', 1, true, 53000, 55000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('106e9932-74f4-498a-9b5a-8399c1c50081', 'f3d81792-9651-4708-a2eb-00247375ac58', '010824', '2026-08-01', 0, 53000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('e7151859-8df5-47be-83db-7f7a1f8ba815', 'f3d81792-9651-4708-a2eb-00247375ac58', 'VPF47A', '2027-06-02', 5, 53000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('7824dfb8-8a7f-4134-90ba-baa22bc56890', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000772', '8938554952037', 'Dung dịch xịt mũi Xylopisy', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('ad24c7ee-5992-4dcb-b2b2-e97f1c3013f3', '7824dfb8-8a7f-4134-90ba-baa22bc56890', 'Chai', 1, true, 0, 50000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('df0b0432-b848-46e0-857a-9944c2c36e09', '7824dfb8-8a7f-4134-90ba-baa22bc56890', '0', '2026-12-24', 5, 0);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('dabdeaa1-9328-4523-807e-a9a03c52bc93', '7824dfb8-8a7f-4134-90ba-baa22bc56890', '012023', '2026-12-24', 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('5d4c6f7a-3caa-4507-b8b9-cd4ee066ae02', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000768', NULL, 'Calci sủi Boston 500mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('03ede970-5e6f-495e-8d21-2b2324445c0e', '5d4c6f7a-3caa-4507-b8b9-cd4ee066ae02', 'Viên', 1, true, 3000, 4000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('2b658f9d-de5a-4cfa-a235-11c758fd0af5', '5d4c6f7a-3caa-4507-b8b9-cd4ee066ae02', '040325', '2028-03-04', 0, 3000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('665c23a7-157c-4245-a203-2b44d3ebb563', '5d4c6f7a-3caa-4507-b8b9-cd4ee066ae02', '080825', '2028-05-05', 0, 3000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('e2508c01-fd29-407b-b065-05a90096e6e5', '5d4c6f7a-3caa-4507-b8b9-cd4ee066ae02', '140326', '2029-03-23', 200, 3000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('249c21af-dcaf-44da-9db6-4c353986b1b6', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP000765', '8936116251277', 'Biotin mdp', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('3b34ef18-fd95-4e87-9532-fb23799ac0b7', '249c21af-dcaf-44da-9db6-4c353986b1b6', 'Viên', 1, true, 0, 1500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('93d33142-3c3e-4c70-a703-32dd46957f32', '249c21af-dcaf-44da-9db6-4c353986b1b6', '020323', '2026-04-04', 2, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('6745563e-f0cd-48aa-b4a2-47091296de5e', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000764', '8936034560925', 'Mepoly merap', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('4dd4b334-d42c-4fdd-9758-ed5284e141bc', '6745563e-f0cd-48aa-b4a2-47091296de5e', 'Chai', 1, true, 37100, 42000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('59cd0250-0bf3-450b-9fe1-f2f4e635bb5b', '6745563e-f0cd-48aa-b4a2-47091296de5e', '0361024', '2027-10-23', 0, 37100);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('62ba5745-50be-456c-9db7-c2c6062313ab', '6745563e-f0cd-48aa-b4a2-47091296de5e', '0471125', '2028-11-28', 3, 37100);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('e19e80e4-e677-4ef4-a913-214152ee8a43', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000761', '8934903004112', 'Otilin', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('21a80d6a-32aa-4679-bfbf-a53224443be0', 'e19e80e4-e677-4ef4-a913-214152ee8a43', 'Chai', 1, true, 0, 8000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('17cc510f-2b8c-4b8a-b330-b715c9e4dc4b', 'e19e80e4-e677-4ef4-a913-214152ee8a43', '134041', '2026-05-13', 8, 0);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('7746f11a-151f-4815-ba87-a9e15b231a79', 'e19e80e4-e677-4ef4-a913-214152ee8a43', '135079', '2027-11-24', 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('642cfc71-f5f3-4086-9138-5ff3b14a4f44', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000760', '99123970', 'Systane ultra chai lớn', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('624e2c69-a31c-4773-bfe6-6ef7a78f40d3', '642cfc71-f5f3-4086-9138-5ff3b14a4f44', 'Chai', 1, true, 105800, 110000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('c83d5a44-6ba0-4f6e-90ef-9741abe133b1', '642cfc71-f5f3-4086-9138-5ff3b14a4f44', '12EEY', '2026-08-19', 0, 105800);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('6cad0b4b-5f51-43ee-addf-05916a8fd8e9', '642cfc71-f5f3-4086-9138-5ff3b14a4f44', '12UH7', '2027-03-29', 1, 105800);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('0d9c15fe-c4f5-412d-a4a1-4498f29507f4', '642cfc71-f5f3-4086-9138-5ff3b14a4f44', '12YYX', '2027-06-15', 2, 105800);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('1904587c-a8e4-4c26-88e3-f6f8ca28edf2', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP000758', '8936014583326', 'Becoron-C', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('15356372-f76f-4bb5-97b7-907d713f9f60', '1904587c-a8e4-4c26-88e3-f6f8ca28edf2', 'Viên', 1, true, 0, 2000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('a402827d-67ff-4a0c-9aea-322d0bbdd176', '1904587c-a8e4-4c26-88e3-f6f8ca28edf2', '250723', '2026-07-26', 0, 0);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('a00728e6-fef6-4d52-bcfb-23895c3995bb', '1904587c-a8e4-4c26-88e3-f6f8ca28edf2', '070825', '2027-01-31', 153, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('20cafb77-7ec6-4732-bad5-3c4609efe5e0', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000757', '8934589000330', 'Rhinex 0.05 %', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('341b9ef2-070c-465a-83db-90915a3ae25a', '20cafb77-7ec6-4732-bad5-3c4609efe5e0', 'Chai', 1, true, 0, 8000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('7c23ac6f-62dc-4b42-939d-577ac05d64f8', '20cafb77-7ec6-4732-bad5-3c4609efe5e0', '240642', '2027-06-10', 10, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('e1a3e8ab-5bcd-4609-b2e9-3394c703e0c8', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000756', '8935006510074', 'V.rohto New', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('c33c31e3-5e07-4b2c-8116-3c3120976f0e', 'e1a3e8ab-5bcd-4609-b2e9-3394c703e0c8', 'Chai', 1, true, 52400, 55000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('33da7508-49d0-4ffd-bef9-811756d5d655', 'e1a3e8ab-5bcd-4609-b2e9-3394c703e0c8', 'JA02-3', '2027-10-01', 0, 52400);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('5410e668-e23b-48c6-8ab4-0275c6e21897', 'e1a3e8ab-5bcd-4609-b2e9-3394c703e0c8', 'DB02', '2028-04-20', 0, 52400);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('4d1c19f0-a308-4203-bed9-aaf392e30882', 'e1a3e8ab-5bcd-4609-b2e9-3394c703e0c8', 'IB09', '2028-09-29', 0, 52400);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('e79778fe-55a8-47a0-991a-41700adf6b6c', 'e1a3e8ab-5bcd-4609-b2e9-3394c703e0c8', 'jb09', '2028-10-18', 0, 52400);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('a95d5a46-76e8-4869-80ee-3717813e8e11', 'e1a3e8ab-5bcd-4609-b2e9-3394c703e0c8', 'CC04', '2029-03-26', 10, 52400);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('ccf8a477-7f03-4773-af53-de328f59a488', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP000754', '8938550446172', 'Hotamin gineng viphar', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('eb7124c1-7234-4eb3-9aae-621b357e7b72', 'ccf8a477-7f03-4773-af53-de328f59a488', 'Vỉ', 1, true, 0, 5000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('f292e98e-fa6d-4aab-bdc0-e29367fb1ffd', 'ccf8a477-7f03-4773-af53-de328f59a488', '010225', '2028-02-03', 75, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('1ab9e06e-b896-4c2d-a71a-7034c8f1f2e6', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000753', '8936034561007', 'Thuốc xịt mũi benita', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('4b48a40b-0da6-4127-ac35-50acb8d36758', '1ab9e06e-b896-4c2d-a71a-7034c8f1f2e6', 'Chai', 1, true, 91000, 95000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('64386afb-253b-4134-b812-456b29f106e0', '1ab9e06e-b896-4c2d-a71a-7034c8f1f2e6', '0100425', '2027-04-17', 0, 91000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('e6f2791f-69ce-4a20-8847-ecb4c89be705', '1ab9e06e-b896-4c2d-a71a-7034c8f1f2e6', '0271125', '2027-11-09', 2, 91000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('fa1ec322-13b5-4a6e-b866-9d415e2bbd8c', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000751', NULL, 'Systane ultra', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('dbcb0043-0b26-43ea-b109-984c9281aabe', 'fa1ec322-13b5-4a6e-b866-9d415e2bbd8c', 'Chai', 1, true, 0, 70000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('c83a4fad-3a0b-4ee3-b91e-f2584281aa36', 'fa1ec322-13b5-4a6e-b866-9d415e2bbd8c', 'L2EJH', '2026-05-05', 0, 0);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('ec6cd1cf-9c97-499a-98aa-5f737b57e49a', 'fa1ec322-13b5-4a6e-b866-9d415e2bbd8c', '12yyy', '2027-08-08', 2, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('ebb52abb-b34e-4078-9345-0fc5085f8f87', '290d7875-db14-4fae-9b9e-7413022816c8', 'SP000750', '8936034560932', 'Thuốc nhỏ mắt syseye', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('b1bd7dc6-59ef-4a46-a80d-258eda9bad75', 'ebb52abb-b34e-4078-9345-0fc5085f8f87', 'Chai', 1, true, 26900, 30000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('12bae327-47ec-4290-a223-98d3c3859ae7', 'ebb52abb-b34e-4078-9345-0fc5085f8f87', '0020325', '2027-03-23', 0, 26900);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('5b6cea42-4d54-4e03-a292-0254e08a335a', 'ebb52abb-b34e-4078-9345-0fc5085f8f87', '0', '2027-05-21', 0, 26900);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('eba3026b-c673-4a6a-9228-0ecd53ce2a7f', 'ebb52abb-b34e-4078-9345-0fc5085f8f87', '0101025', '2027-10-26', 0, 26900);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('8fb52c8f-b9eb-411d-ad0f-3f34847f1f4e', 'ebb52abb-b34e-4078-9345-0fc5085f8f87', '0030426', '2028-04-08', 8, 26900);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('f00350b3-b9d9-4ac2-a213-40cdc17a588d', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP0007480', '3846846832', 'Viên ích mẫu', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('bac2d7da-4e31-4b46-adb5-5b6b641295b7', 'f00350b3-b9d9-4ac2-a213-40cdc17a588d', 'Viên', 1, true, 10000, 1000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('158c156d-0e25-47ea-bd40-1e7231737239', 'f00350b3-b9d9-4ac2-a213-40cdc17a588d', '0124', '2027-02-01', 0, 10000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('e8896d1d-76d3-4494-9d40-5b4807498f40', 'f00350b3-b9d9-4ac2-a213-40cdc17a588d', '0225', '2028-08-01', 380, 10000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('6482ff9c-9c24-461f-b016-06970646b7d3', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP000745', '8992772363068', 'Sensa Cool', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('a677aa7a-972d-41b4-8eea-c35a2d21a3da', '6482ff9c-9c24-461f-b016-06970646b7d3', 'Gói', 1, true, 3743, 4500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('d830b5fc-0dc9-4eac-a757-959f71f3c2f7', '6482ff9c-9c24-461f-b016-06970646b7d3', '030K24', '2026-05-22', 0, 3743);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('34ffb751-ceb8-45cb-bdf0-4122a481ccc1', '6482ff9c-9c24-461f-b016-06970646b7d3', '008l24', '2026-06-03', 0, 3743);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('88670deb-7cc0-46f5-b8d3-ff1efee7cbdf', '6482ff9c-9c24-461f-b016-06970646b7d3', '070K25', '2027-05-25', 0, 3743);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('fb5363fb-c4e5-46b8-a69b-d0c3b14ca150', '6482ff9c-9c24-461f-b016-06970646b7d3', '086k25', '2027-05-28', 0, 3743);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('c76c7810-0555-4950-ae35-6481f399abdd', '6482ff9c-9c24-461f-b016-06970646b7d3', '025B26', '2027-08-05', 240, 3743);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('238c3b6c-6911-4822-92bb-86ba166c16dc', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP000741', '8938509942236', 'Viên nghệ đen vhoney 150g', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('26850670-f547-438c-b520-d7fed4ae7138', '238c3b6c-6911-4822-92bb-86ba166c16dc', 'Lọ', 1, true, 46500, 80000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('bb431328-165b-44f5-b4cf-15d609d31fe9', '238c3b6c-6911-4822-92bb-86ba166c16dc', '100325', '2027-03-10', 3, 46500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('66de7559-5dc9-4d29-8d19-075b6d6208eb', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP000740', '8938529807188', 'Viên nghệ đen Châu Long Phát', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('44112deb-ee33-4d30-8572-dc6c7512b05e', '66de7559-5dc9-4d29-8d19-075b6d6208eb', 'Lọ', 1, true, 48100, 60000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('102aa53a-6466-4353-9a1c-68dfb354c316', '66de7559-5dc9-4d29-8d19-075b6d6208eb', '050625', '2027-06-05', 0, 48100);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('a753f832-20d9-4e5f-822c-61ce799b64c7', '66de7559-5dc9-4d29-8d19-075b6d6208eb', '05/12/25', '2027-12-05', 8, 48100);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('66c33729-483d-43ac-bc9f-e98945940d84', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP000739', '8934567022019', 'Kim tiền thảo opc', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('ed485d8d-e1b2-44e0-8472-1a0150bb8381', '66c33729-483d-43ac-bc9f-e98945940d84', 'Lọ', 1, true, 66400, 70000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('fde7b533-cdd1-442e-8867-f99dbe43eb04', '66c33729-483d-43ac-bc9f-e98945940d84', '24029', '2027-09-25', 0, 66400);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('4c2535e5-c7df-4255-944d-485e810f4a11', '66c33729-483d-43ac-bc9f-e98945940d84', '25020', '2028-08-04', 2, 66400);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('0e962f25-b3dd-48e7-b362-3ae6c89af603', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP000736', '8936178750220', 'Trinh nữ hoàng cung', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('f1ca27e3-897b-4781-be48-cf20e1e12262', '0e962f25-b3dd-48e7-b362-3ae6c89af603', 'Lọ', 1, true, 0, 100000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('5c4be6a3-bc63-4c85-b715-0178923847ed', '0e962f25-b3dd-48e7-b362-3ae6c89af603', '010124', '2027-01-04', 6, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('be53b6bf-bdfd-4956-adf0-43fce418310e', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP000735', '8938540618381', 'Ginkgo Nattokinase', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('24ce8674-87c3-451c-a4b0-6b23ca9030f8', 'be53b6bf-bdfd-4956-adf0-43fce418310e', 'Lọ', 1, true, 0, 250000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('ce8eb1ab-d92c-4ab3-ab91-86f186fe8b8f', 'be53b6bf-bdfd-4956-adf0-43fce418310e', '010824', '2027-08-20', 6, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('a42b53af-5b32-4000-9bdf-d3d4148fee01', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP000728', '8938507601401', 'Herba cool vị chanh', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('0ebf653c-67ad-439a-8ee3-03d1b9c4ab85', 'a42b53af-5b32-4000-9bdf-d3d4148fee01', 'Hộp', 1, true, 32300, 40000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('71b220b4-2641-4f87-bf92-7b710b45494f', 'a42b53af-5b32-4000-9bdf-d3d4148fee01', '0', '2027-06-11', 0, 32300);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('b0e13b7b-529a-4fad-a3c0-846423bfe621', 'a42b53af-5b32-4000-9bdf-d3d4148fee01', '00425', '2028-09-12', 3, 32300);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('f3495974-bb08-4cd5-b7e6-d8e2236b7ef5', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP000726', '8938500688256', 'Tiêu khiết Thanh', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('826c0d0f-4a34-49d2-ad9e-bb382be95ddd', 'f3495974-bb08-4cd5-b7e6-d8e2236b7ef5', 'Viên', 1, true, 167900, 6000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('44fc1c9f-80b6-4759-a692-c1e4aaa4dd1f', 'f3495974-bb08-4cd5-b7e6-d8e2236b7ef5', '010125', '2028-01-11', 30, 167900);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('a0e2708c-0cb8-42d2-99e4-27a315adcabc', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP000723', '8934940032437', 'Cebraton', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('9aeca121-8958-4130-b83a-8653a7b55bf2', 'a0e2708c-0cb8-42d2-99e4-27a315adcabc', 'Viên', 1, true, 3004, 3200);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('c48f63a5-f1ce-455e-8401-d69696fc97d2', 'a0e2708c-0cb8-42d2-99e4-27a315adcabc', '2325', '2027-02-25', 0, 3004);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('33e74f26-4553-42fa-b654-26981d5b7e2f', 'a0e2708c-0cb8-42d2-99e4-27a315adcabc', '3425', '2027-05-06', 0, 3004);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('c4e19e15-d820-4a24-ad42-947591c2f087', 'a0e2708c-0cb8-42d2-99e4-27a315adcabc', '3925', '2027-05-09', 0, 3004);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('a66c509a-cc83-454e-92b6-6dccc0d3d818', 'a0e2708c-0cb8-42d2-99e4-27a315adcabc', '0', '2027-07-17', 0, 3004);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('3beff1c9-e298-400e-b2fe-359ee12f002a', 'a0e2708c-0cb8-42d2-99e4-27a315adcabc', '11125', '2027-10-18', 0, 3004);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('a1512cd7-7bc1-4ed5-92a0-871b49399b47', 'a0e2708c-0cb8-42d2-99e4-27a315adcabc', '11825', '2027-11-03', 150, 3004);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('1d968290-2804-4349-951e-f43c5bb82926', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP000720', '8934940030389', 'Hoạt Huyết Dưỡng Não Traphaco', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('8e903b12-1971-4520-acef-0c8b85767072', '1d968290-2804-4349-951e-f43c5bb82926', 'Viên', 1, true, 1083.5, 1200);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('00ee1d2f-138d-4087-97c5-d478f1719fe7', '1d968290-2804-4349-951e-f43c5bb82926', '121224', '2027-08-08', 0, 1083.5);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('03069ca9-3e60-4ee6-b99e-3016d35f6685', '1d968290-2804-4349-951e-f43c5bb82926', '12124', '2027-08-08', 0, 1083.5);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('84003221-d599-4d35-b496-151e84d775a6', '1d968290-2804-4349-951e-f43c5bb82926', '19925', '2028-11-09', 0, 1083.5);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('8e19c394-3013-4cc4-a690-c801c11b5b7e', '1d968290-2804-4349-951e-f43c5bb82926', '23625', '2028-12-16', 1020, 1083.5);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('6510c82f-2155-4681-868d-e42d4f339178', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP000719', '8936079381417', 'Hoạt Huyết Nhất Nhất', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('18880f86-13c4-4d73-988f-e7b4a54ad73d', '6510c82f-2155-4681-868d-e42d4f339178', 'Hộp', 1, true, 134700, 140000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('30677bed-7ddb-43bf-93d1-41709693c864', '6510c82f-2155-4681-868d-e42d4f339178', '680425', '2028-04-10', 0, 134700);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('98b9165d-ba33-4e73-a61b-2a4da982277a', '6510c82f-2155-4681-868d-e42d4f339178', '102025', '2028-06-17', 0, 134700);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('ea19ad54-e092-44da-97a8-7fadcdf4c2af', '6510c82f-2155-4681-868d-e42d4f339178', '1711025', '2028-10-29', 0, 134700);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('fcc1f1e4-813a-4c09-956a-1104fcd979d2', '6510c82f-2155-4681-868d-e42d4f339178', '1821125', '2028-11-17', 0, 134700);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('dffa8633-30d1-41e0-af8d-d8051b78a38f', '6510c82f-2155-4681-868d-e42d4f339178', '040126', '2029-01-10', 1, 134700);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('1d814bf1-0471-4ff7-9ccc-dae05a01ebf4', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP000714', '8936203427561', 'Multivitamin 20-B', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('d546178a-b2a3-4674-8405-face76125b7f', '1d814bf1-0471-4ff7-9ccc-dae05a01ebf4', 'Viên', 1, true, 1000, 1500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('1faa5154-c26d-4a1d-a52a-7560d9ca542b', '1d814bf1-0471-4ff7-9ccc-dae05a01ebf4', '020', '2027-09-11', 0, 1000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('b9bd357c-a71a-4e7a-8427-1dd767608307', '1d814bf1-0471-4ff7-9ccc-dae05a01ebf4', '0', '2028-01-01', 230, 1000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('cd97152a-4946-4b2f-986e-a19fdcb8a04f', '1d814bf1-0471-4ff7-9ccc-dae05a01ebf4', '020326', '2029-03-15', 1000, 1000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('2998a675-52af-4c46-bbdb-56269915df4c', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP000710', '8936151982419', 'Calci vỉ 10k', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('5d2018ee-57a7-433a-a54f-87421681b847', '2998a675-52af-4c46-bbdb-56269915df4c', 'Viên', 1, true, 600, 1000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('9435edcb-6525-4281-b413-f5f0c885f0c9', '2998a675-52af-4c46-bbdb-56269915df4c', '000106', '2027-06-25', 0, 600);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('7a563261-e5c5-4222-900c-71c3cc0435ed', '2998a675-52af-4c46-bbdb-56269915df4c', '070825', '2028-04-02', 540, 600);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('877383bb-0e0e-4bec-9033-da02b6588d70', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP000707', '8936139620128', 'Dưỡng Khớp Linh', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('e6e5a59f-df70-4eb0-8470-a180142660a1', '877383bb-0e0e-4bec-9033-da02b6588d70', 'Viên', 1, true, 2000, 4000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('f1d6b865-5104-451e-8235-90c3ca062d34', '877383bb-0e0e-4bec-9033-da02b6588d70', '1021023', '2026-10-04', 0, 2000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('7ab96985-54c5-4b95-92bc-ec757bc88dcd', '877383bb-0e0e-4bec-9033-da02b6588d70', '1020225', '2028-02-05', 0, 2000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('9f20a6a3-4cb0-4572-bce8-aec97363dde6', '877383bb-0e0e-4bec-9033-da02b6588d70', '1120126', '2029-01-28', 240, 2000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('b92e540c-c18f-4584-8bc7-3e8be5594dc8', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000705', '8936123411268', 'Calcium Corbiere extra 5ml', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('59503331-199e-4f18-927c-ec6f68562588', 'b92e540c-c18f-4584-8bc7-3e8be5594dc8', 'Hộp', 1, true, 145000, 170000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('12fa3ae9-e496-4763-a043-a0810036a2cc', 'b92e540c-c18f-4584-8bc7-3e8be5594dc8', 'FVH0213', '2026-07-12', 0, 145000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('b475bc8a-fe9a-493b-9521-c8d7f7916150', 'b92e540c-c18f-4584-8bc7-3e8be5594dc8', '0', '2027-02-21', 0, 145000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('2082fe1a-fede-4cdb-a2c3-7c32b2aa9a7c', 'b92e540c-c18f-4584-8bc7-3e8be5594dc8', '2691', '2027-05-19', 0, 145000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('bd2b181c-4c2a-4a69-9365-d3e2c715c782', 'b92e540c-c18f-4584-8bc7-3e8be5594dc8', '1423', '2027-06-19', 3, 145000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('c60ccc09-df79-429b-944c-d732356f302e', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP000703', NULL, 'Cồn 70 (Chai Lớn Vòi )', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('1af5ebc8-c5e1-4678-9839-9cac9f7692e4', 'c60ccc09-df79-429b-944c-d732356f302e', 'Chai', 1, true, 45500, 60000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('2f8c9672-9f6a-4e11-9fc1-a7ae136b1771', 'c60ccc09-df79-429b-944c-d732356f302e', 'LGCS111224', '2027-12-22', 0, 45500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('d4e64b5e-299b-4031-86e4-02b7ce7300d8', 'c60ccc09-df79-429b-944c-d732356f302e', '0', '2028-08-20', 0, 45500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('601c1b5c-de96-4660-8cfc-33f5f5e67f31', 'c60ccc09-df79-429b-944c-d732356f302e', '201025', '2028-10-20', 0, 45500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('2a536c69-14bc-422d-8b6c-81e5a715fc58', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP000701', '8935049902829', 'Povidine chai nhỏ', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('af8ccbb8-57c4-4194-b522-7a2a1ae42e1e', '2a536c69-14bc-422d-8b6c-81e5a715fc58', 'Chai', 1, true, 6000, 8000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('68e331d9-0d4a-4b88-8f9f-e7a692b39e6d', '2a536c69-14bc-422d-8b6c-81e5a715fc58', '0061224', '2026-12-12', 0, 6000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('07dfa837-abac-4e6e-9164-0663fb060190', '2a536c69-14bc-422d-8b6c-81e5a715fc58', '006425', '2028-12-11', 20, 6000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('1aaf4626-0f94-4514-bf66-3390ca10016f', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP000699', '8936024398446', 'Hasanvit C Sủi', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('8d7bba81-2383-4aa8-9dcd-305abd6dc2ee', '1aaf4626-0f94-4514-bf66-3390ca10016f', 'Tuýp', 1, true, 16700, 20000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('43fb3263-3eb0-435a-8b14-5465b52d48b2', '1aaf4626-0f94-4514-bf66-3390ca10016f', '00425', '2027-03-10', 29, 16700);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('2e439798-1ced-4463-8822-754f88af5a3b', '6afa32c5-1630-49f2-9d0f-06168b96b389', 'SP000697', NULL, 'Milian', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('b11dc518-d5b9-4aaa-97cf-4edeae9c041a', '2e439798-1ced-4463-8822-754f88af5a3b', 'Chai', 1, true, 5600, 8000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('5ae0836f-82cb-4a68-9bd1-70a1cf6559d6', '2e439798-1ced-4463-8822-754f88af5a3b', '020924-TBYT', '2027-09-16', 18, 5600);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('baae8985-45f7-49be-81ab-4cebe904be97', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP000696', NULL, 'Băng Keo Lớn Vitas go', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('2acf1145-4324-4b7f-96e9-84f1805bb7a8', 'baae8985-45f7-49be-81ab-4cebe904be97', 'Hộp', 1, true, 9525, 15000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('cd1dbb97-a05c-4883-a640-ec1fb0e9c6da', 'baae8985-45f7-49be-81ab-4cebe904be97', '0', '2027-01-01', 0, 9525);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('25c23929-df71-4eaa-9697-c9196a915c56', 'baae8985-45f7-49be-81ab-4cebe904be97', '012025', '2029-01-31', 44, 9525);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('108cd45f-aacb-4c39-90ea-df0cdf973967', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP000695', '8935049904182', 'Povidine Chai lớn', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('fa240198-b23f-4f43-b74f-95f0c6ed7dfd', '108cd45f-aacb-4c39-90ea-df0cdf973967', 'Chai', 1, true, 22000, 25000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('4cf3ad5b-cdbd-4039-8dcf-417f290d12b9', '108cd45f-aacb-4c39-90ea-df0cdf973967', '0020125', '2027-01-02', 0, 22000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('96c28add-56ed-47ef-85e9-2803f2b59be6', '108cd45f-aacb-4c39-90ea-df0cdf973967', '25002', '2028-09-22', 0, 22000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('7f6b9eee-e9f4-4df0-abcd-d0319b7a74d9', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP000694', '8850109001130', 'Dầu Thái Đỏ Siang Pure oil 3ml', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('c8b53f59-aecb-4f16-85a7-cd418ee4c1ba', '7f6b9eee-e9f4-4df0-abcd-d0319b7a74d9', 'Chai', 1, true, 17000, 20000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('5063acaa-c738-4ee9-9fd0-91c3bf51d8ae', '7f6b9eee-e9f4-4df0-abcd-d0319b7a74d9', '026012G/5', '2029-01-09', 0, 17000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('4fff2e65-6c4c-4472-9b86-b769d96a214a', '7f6b9eee-e9f4-4df0-abcd-d0319b7a74d9', '140111G/2', '2030-07-18', 0, 17000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('42a5ad0d-2848-4bc6-a28c-fc89910fae57', '7f6b9eee-e9f4-4df0-abcd-d0319b7a74d9', 'O25B36G/2', '2030-11-25', 19, 17000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('315a25c8-7c84-4eb1-a15d-b9465152e40c', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP000693', '8850109001123', 'Dầu Thái lớn siang pure oil', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('8e1d897c-72e7-4600-ad1f-b416572e03ff', '315a25c8-7c84-4eb1-a15d-b9465152e40c', 'Chai', 1, true, 30000, 32000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('a5c457ba-81bd-4462-ab9b-0030e9ce6bc3', '315a25c8-7c84-4eb1-a15d-b9465152e40c', '131131G', '2029-12-09', 0, 30000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('21b590cd-1f47-47c2-a2ff-bd319a157640', '315a25c8-7c84-4eb1-a15d-b9465152e40c', 'O24101G', '2030-11-18', 16, 30000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('98d460c6-1204-4c3d-a83d-b4d6c7293b2f', '6afa32c5-1630-49f2-9d0f-06168b96b389', 'SP000690', '8934940010015', 'Trapha traphaco', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('40567492-e8ac-44cb-a9de-b67d35cf022c', '98d460c6-1204-4c3d-a83d-b4d6c7293b2f', 'Chai', 1, true, 12700, 15000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('b408bcf1-e968-49fe-ab62-f96c7bb96364', '98d460c6-1204-4c3d-a83d-b4d6c7293b2f', '1325', '2028-03-08', 0, 12700);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('0fcf6379-6299-4b06-9329-ebe8df96e426', '98d460c6-1204-4c3d-a83d-b4d6c7293b2f', '4125', '2028-11-15', 0, 12700);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('8793b44a-82dc-4d18-aca6-4845045a3787', '98d460c6-1204-4c3d-a83d-b4d6c7293b2f', '0626', '2029-01-26', 4, 12700);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d0d5a7e7-7808-43ee-8230-5fcd93d631d6', '6afa32c5-1630-49f2-9d0f-06168b96b389', 'SP000689', NULL, 'Dầu Mù U', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('3147bd4e-11d4-43c1-850b-babfe6253c65', 'd0d5a7e7-7808-43ee-8230-5fcd93d631d6', 'Chai', 1, true, 5570, 10000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('b18fc8b5-92c4-418c-914d-f6194dc2fe48', 'd0d5a7e7-7808-43ee-8230-5fcd93d631d6', 'V001', '2027-12-06', 53, 5570);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('94640309-760f-4a9e-87cd-3f0b98b7b84f', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP000686', '8936043810356', 'Miếng Dán Hạ Sốt', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('cc2c77dd-b02b-4b67-b95d-a63beaa842bf', '94640309-760f-4a9e-87cd-3f0b98b7b84f', 'Gói', 1, true, 7000, 10000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('dd2aa69c-233e-4d88-8df3-f7a0939dc177', '94640309-760f-4a9e-87cd-3f0b98b7b84f', '010924', '2027-09-05', 0, 7000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('00f22c7c-d2e5-46a3-b1d5-6fd32792ccfa', '94640309-760f-4a9e-87cd-3f0b98b7b84f', '0', '2029-10-05', 20, 7000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('48dd45cf-f7f3-420f-9e99-7665a0ed79a0', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP000681', '8936069240014', 'Gạc Rơ Lưỡi Dopha', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('60c2f2d3-7c20-4a29-9102-a51f0cab66ca', '48dd45cf-f7f3-420f-9e99-7665a0ed79a0', 'Hộp', 1, true, 1500, 2000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('3a568f93-626b-41c6-abfc-14de5df25c95', '48dd45cf-f7f3-420f-9e99-7665a0ed79a0', 'DP005/24', '2027-11-01', 0, 1500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('05d83a71-dce3-4749-a613-146cee38e0f5', '48dd45cf-f7f3-420f-9e99-7665a0ed79a0', '0', '2028-06-30', 0, 1500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('30f4ec69-b553-40ba-bcb9-74372bd11271', '48dd45cf-f7f3-420f-9e99-7665a0ed79a0', 'DP004/25', '2028-12-31', 27, 1500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('27919e8f-a52d-4e5c-b773-50bfaea97752', '6afa32c5-1630-49f2-9d0f-06168b96b389', 'SP000680', NULL, 'Gynapax', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('d64ebfab-8299-4d37-845c-8723673dad22', '27919e8f-a52d-4e5c-b773-50bfaea97752', 'Hộp', 1, true, 27500, 30000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('3e21ca40-8c8c-4e82-adfb-056464473716', '27919e8f-a52d-4e5c-b773-50bfaea97752', '0', '2027-01-01', 0, 27500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('7fe30298-702c-44e5-8cbf-313d17aba673', '27919e8f-a52d-4e5c-b773-50bfaea97752', '070824', '2027-08-01', 0, 27500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('66e58d02-31a0-411f-99aa-2fcb14152a4a', '27919e8f-a52d-4e5c-b773-50bfaea97752', '040925', '2028-09-05', 2, 27500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('424b8b6e-e14a-4850-9841-071cf4fe6aaa', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP000678', '8934567003414', 'Oxy già', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('49932094-c85c-4241-8f57-9ca099dfed23', '424b8b6e-e14a-4850-9841-071cf4fe6aaa', 'Chai', 1, true, 2250, 5000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('f635f5dd-4a25-4343-a818-9b9b72f6c33b', '424b8b6e-e14a-4850-9841-071cf4fe6aaa', '23008', '2026-06-01', 0, 2250);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('d4eee720-2554-4f0e-a324-e6333fd40e95', '424b8b6e-e14a-4850-9841-071cf4fe6aaa', '031125', '2028-11-03', 0, 2250);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('b67cb520-5615-4c8f-be02-87956826afd0', '424b8b6e-e14a-4850-9841-071cf4fe6aaa', '05012026', '2029-01-05', 63, 2250);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('410eb048-7634-4f40-ba0b-d5ddf9ec0945', '6afa32c5-1630-49f2-9d0f-06168b96b389', 'SP000676', NULL, 'DENICOL-15ML', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('b8dd1159-1c5b-435c-a2da-3e1c238274fe', '410eb048-7634-4f40-ba0b-d5ddf9ec0945', 'Chai', 1, true, 20000, 25000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('3bead2c1-4b09-42cd-96f1-48be314ea8db', '410eb048-7634-4f40-ba0b-d5ddf9ec0945', '030125', '2028-01-12', 0, 20000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('d575f5d8-924d-4575-8b4e-3972df524408', '410eb048-7634-4f40-ba0b-d5ddf9ec0945', '020126', '2029-01-08', 5, 20000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('404a497c-607c-4a86-91b8-987e800e3a57', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP000674', '8935049903697', 'Nabifar pharmedic', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('54965d00-eb13-40e5-afbf-92b6b091f45a', '404a497c-607c-4a86-91b8-987e800e3a57', 'Hộp', 1, true, 8920, 10000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('b50c2f6b-a89c-4206-86b2-38957df51533', '404a497c-607c-4a86-91b8-987e800e3a57', '0160325', '2028-03-27', 0, 8920);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('0bdf86a4-1bb9-4463-9984-61e8f44fc87e', '404a497c-607c-4a86-91b8-987e800e3a57', '1025', '2028-11-03', 10, 8920);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('447e0558-ab76-4241-a972-1cd1f7d7cdac', '6afa32c5-1630-49f2-9d0f-06168b96b389', 'SP000672', NULL, 'Vaseline chai', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('c7461552-0da7-474a-90ea-b963d914dbd0', '447e0558-ab76-4241-a972-1cd1f7d7cdac', 'Chai', 1, true, 4000, 6000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('1751a4b3-2750-4c6a-8360-eb7f3dc08983', '447e0558-ab76-4241-a972-1cd1f7d7cdac', '020124', '2027-01-01', 0, 4000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('51181eba-84b0-4a42-a4a5-5c23170c097e', '447e0558-ab76-4241-a972-1cd1f7d7cdac', '020125', '2028-01-30', 351, 4000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('4cde489f-8a11-4ef1-963f-7e6a4fee1d36', 'cdae30e0-9366-4a54-b2b0-4dc3776f8fe5', 'SP000670', '42182627', 'Vaseline', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('6e51af79-7c10-4b38-b2cf-80da173ec7e2', '4cde489f-8a11-4ef1-963f-7e6a4fee1d36', 'Hủ', 1, true, 49500, 55000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('cf532d63-f65c-4b51-85d3-4cef8ef4596a', '4cde489f-8a11-4ef1-963f-7e6a4fee1d36', '273', '2028-09-12', 0, 49500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('e30ec375-103f-49f9-890a-9363336b948b', '4cde489f-8a11-4ef1-963f-7e6a4fee1d36', '42792PUB', '2028-12-01', 8, 49500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('0274a957-9bdf-4817-9e69-733005e94a94', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP000669', '8935049916956', 'Ddvs gynofar 250ml', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('d5a61953-ad79-4662-8546-b43618792f3a', '0274a957-9bdf-4817-9e69-733005e94a94', 'Chai', 1, true, 16750, 20000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('e4fb640f-a648-48fa-8fac-ec6007f18f7e', '0274a957-9bdf-4817-9e69-733005e94a94', '03040525', '2027-11-07', 0, 16750);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('963987ca-31d2-45dc-bc33-d837e77d79b7', '0274a957-9bdf-4817-9e69-733005e94a94', '0', '2028-02-14', 0, 16750);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('1972e52c-7607-4f8f-8dbb-5b5a7b48421f', '0274a957-9bdf-4817-9e69-733005e94a94', '2641225', '2028-06-25', 3, 16750);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d88946d2-7f53-4dd6-a6bc-f1bf9cce9694', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP000668', '8935049916963', 'Dung Dịch Gynofar 500ml', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('ca12058a-2343-445f-81be-48c0f6ad5fa6', 'd88946d2-7f53-4dd6-a6bc-f1bf9cce9694', 'Chai', 1, true, 23700, 27000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('91066131-1098-43e1-9dc9-30794c53af09', 'd88946d2-7f53-4dd6-a6bc-f1bf9cce9694', '4780425', '2027-10-17', 0, 23700);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('72f8c5c4-6a50-4214-8f82-a7a083daf95f', 'd88946d2-7f53-4dd6-a6bc-f1bf9cce9694', '0', '2028-01-24', 0, 23700);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('3f23b3bf-6f30-48d4-a1b2-e97f5edd9836', 'd88946d2-7f53-4dd6-a6bc-f1bf9cce9694', '14951225', '2028-06-19', 3, 23700);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('31504e05-7c7d-4a99-b375-d702a40a9806', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP000666', NULL, 'Gội là Đen', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('c52da6d8-135d-47ed-b921-78c37cd0483d', '31504e05-7c7d-4a99-b375-d702a40a9806', 'Gói', 1, true, 15380, 20000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('ef445403-0034-482e-b44e-06c386f693fd', '31504e05-7c7d-4a99-b375-d702a40a9806', '010723', '2026-07-01', 0, 15380);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('1772537e-1a22-4495-bfa0-386bc9d1cf22', '31504e05-7c7d-4a99-b375-d702a40a9806', '0', '2028-05-25', 0, 15380);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('a8fe19b0-804c-4095-81df-22cca11249a4', '31504e05-7c7d-4a99-b375-d702a40a9806', '25003', '2028-10-30', 3, 15380);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('38bb296f-aac4-42eb-af91-490fed64f017', '31504e05-7c7d-4a99-b375-d702a40a9806', '26001', '2029-04-02', 50, 15380);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('358e0194-52f5-4a39-a78f-43e2a00043a5', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP000665', '8936051012223', 'Gội là Nâu', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('8b73a7aa-7499-4e41-9631-afcb7cdd2bc8', '358e0194-52f5-4a39-a78f-43e2a00043a5', 'Gói', 1, true, 15000, 20000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('de211946-8e82-4b3c-9953-6a04b13e6750', '358e0194-52f5-4a39-a78f-43e2a00043a5', '25001', '2028-01-09', 0, 15000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('d312d8f9-f248-4dad-af05-2d5489525c59', '358e0194-52f5-4a39-a78f-43e2a00043a5', '25003', '2028-10-26', 15, 15000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('9fd4ef21-8ea2-4583-abb1-21e54c1fbf1b', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP000664', '8936024920081', 'Tăm Chỉ Nha Khoa', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('981478f7-57e0-404e-a501-545763abb46f', '9fd4ef21-8ea2-4583-abb1-21e54c1fbf1b', 'Hộp', 1, true, 20000, 25000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('66d1eadd-eb13-4ca5-869d-0283ddde025a', '9fd4ef21-8ea2-4583-abb1-21e54c1fbf1b', '0002HD', '2035-02-19', 2, 20000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('21996755-f631-4f51-ac5f-264e05b7933f', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP000663', '8936043811797', 'Tăm Chỉ Denta', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('369a6050-c0b3-4e24-9cea-67eaa267fa6b', '21996755-f631-4f51-ac5f-264e05b7933f', 'Cuộn', 1, true, 21300, 25000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('c5de8149-2ca1-4541-8b45-7b6822a86538', '21996755-f631-4f51-ac5f-264e05b7933f', '180000139', '2028-12-01', 0, 21300);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('0f29accd-b175-40a1-9e48-4ffeef23573c', '21996755-f631-4f51-ac5f-264e05b7933f', '010525', '2030-05-08', 6, 21300);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('f931c893-5456-4129-abe5-29d649ef2388', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000662', '8938521795018', 'Snow Clear gói 5ml', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('344a2289-18f6-4592-90a3-27d62c0f1d4b', 'f931c893-5456-4129-abe5-29d649ef2388', 'Gói', 1, true, 5340, 7000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('ee0e32ec-d018-4dee-bea6-6f964b7d6d75', 'f931c893-5456-4129-abe5-29d649ef2388', '0680824', '2027-08-15', 0, 5340);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('637abb2f-41da-4725-9085-55313f64ee07', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP000661', NULL, 'Bông 100g', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('4eacb260-163a-48ff-b838-86b20c6e38cc', '637abb2f-41da-4725-9085-55313f64ee07', 'Gói', 1, true, 17000, 25000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('a25e71ea-d1d5-4246-b671-1e58c633f0d6', '637abb2f-41da-4725-9085-55313f64ee07', '010325', '2026-09-01', 0, 17000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('cacbe508-b167-49b8-9049-228d5140866a', '637abb2f-41da-4725-9085-55313f64ee07', '0', '2027-07-02', 0, 17000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('653fb0cd-a562-4fa9-aa3e-f0d0d4f9d457', '637abb2f-41da-4725-9085-55313f64ee07', 'D02', '2029-03-01', 29, 17000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('15d9b119-b9b1-48f1-8fff-3149848736c0', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP000659', '8938507697497', 'Băng Keo Lụa Nhỏ', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('fcd285e0-0b83-49be-87be-e4a9605ed1fc', '15d9b119-b9b1-48f1-8fff-3149848736c0', 'Hộp', 1, true, 5700, 10000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('bd3eb291-b623-44ff-ab93-cff086883c78', '15d9b119-b9b1-48f1-8fff-3149848736c0', '012023', '2028-01-01', 0, 5700);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('9c2eb56c-ca5a-4e9e-a9b2-80128632c6da', '15d9b119-b9b1-48f1-8fff-3149848736c0', '0', '2029-05-30', 0, 5700);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('55455169-ce65-4198-bf3c-b50b26c0f0ac', '15d9b119-b9b1-48f1-8fff-3149848736c0', '022025', '2029-05-31', 0, 5700);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('50fc7cbc-dc76-4c55-92dd-7f878ca5b067', '15d9b119-b9b1-48f1-8fff-3149848736c0', '03.2025', '2029-09-30', 93, 5700);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('ea6112f0-c39f-45fa-8a7e-b98dade263f8', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP000650', '8936062880989', 'Ho Đỏ', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('3800e2c1-719c-4e91-8b79-f9008cc2d905', 'ea6112f0-c39f-45fa-8a7e-b98dade263f8', 'Viên', 1, true, 280, 500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('e5c2a42a-0b52-4b3b-bff0-cf340a4f7007', 'ea6112f0-c39f-45fa-8a7e-b98dade263f8', '0424', '2027-09-11', 50, 280);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('ad0d1e05-0d4b-41a4-b23c-bd93349da258', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP000648', '8935049904328', 'Tyrotab', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('d400c425-3ea5-4250-b4b6-7596b27b97dd', 'ad0d1e05-0d4b-41a4-b23c-bd93349da258', 'Vĩ', 1, true, 3100, 5000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('18df184c-9821-4d60-a21d-048d6a455cad', 'ad0d1e05-0d4b-41a4-b23c-bd93349da258', '0070225', '2027-08-28', 0, 3100);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('af0b1d60-ab2c-48a7-b24e-5a7149db340b', 'ad0d1e05-0d4b-41a4-b23c-bd93349da258', '0', '2027-11-06', 0, 3100);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('c9a1f09c-d5fa-4a64-a5c9-2018a85b9083', 'ad0d1e05-0d4b-41a4-b23c-bd93349da258', '0030126', '2028-07-16', 49, 3100);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('e2948b24-72fa-46db-bb56-f453954c3ace', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP000646', '8936193782190', 'Sắt Ống', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('f6c69770-cb72-4872-b6ef-fa8194490691', 'e2948b24-72fa-46db-bb56-f453954c3ace', 'Ống', 1, true, 0, 7500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('ddd1e7f1-2d4b-4db1-93d3-e9c1b7ec8dad', 'e2948b24-72fa-46db-bb56-f453954c3ace', '010224', '2027-02-01', 0, 0);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('40656ccd-3634-41b5-9065-bdf900180e8e', 'e2948b24-72fa-46db-bb56-f453954c3ace', '0', '2028-01-01', 0, 0);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('870ed0b3-adab-47e1-a268-ffbe90493941', 'e2948b24-72fa-46db-bb56-f453954c3ace', '011025', '2028-10-14', 243, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('41c3b05b-ed05-4b59-9ddb-1cb98ecb6797', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP000642', '8936193782275', 'Chất Xơ Pooh Kids', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('47713e6e-3c11-4703-a987-af9286f1f6b5', '41c3b05b-ed05-4b59-9ddb-1cb98ecb6797', 'Ống', 1, true, 3000, 5000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('3865a072-c990-48b4-8aec-f93c2a8a373b', '41c3b05b-ed05-4b59-9ddb-1cb98ecb6797', '010924', '2027-09-27', 144, 3000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('8d472d6b-c646-4d77-84a9-8dea2bb592cf', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP000641', '8938540796539', 'Cà Gai Leo Actiso', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('63b37144-97d1-4b74-9e71-7026db500640', '8d472d6b-c646-4d77-84a9-8dea2bb592cf', 'Ống', 1, true, 4000, 6000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('576d8456-989b-4c4d-9b4b-354c006886e0', '8d472d6b-c646-4d77-84a9-8dea2bb592cf', '010424', '2027-04-07', 0, 4000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('19f97bf8-eb67-462b-a8f2-818361ae29c4', '8d472d6b-c646-4d77-84a9-8dea2bb592cf', '010125', '2028-01-04', 117, 4000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('8b200b3e-082d-4bab-9353-026041f1e77f', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP000638', '8936224540430', 'Canxi Nano Plus', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('1d511184-f4ba-421f-8d17-dcd55dc2a1c9', '8b200b3e-082d-4bab-9353-026041f1e77f', 'Ống', 1, true, 5000, 7500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('7fa654ad-984f-406c-bc0d-93deb2fbff1a', '8b200b3e-082d-4bab-9353-026041f1e77f', '300325', '2028-03-03', 90, 5000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('f0dd810e-bccb-42a1-b6ba-75de1c281fe2', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP000637', '8938536412115', 'Khẩu Trang Em Bé', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('d368a1c6-069d-4ff5-9864-f32deff30f4c', 'f0dd810e-bccb-42a1-b6ba-75de1c281fe2', 'Gói', 1, true, 4000, 10000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('894db5e8-5810-4240-a71a-055d7d00cae9', 'f0dd810e-bccb-42a1-b6ba-75de1c281fe2', 'PT/TN-TE', '2026-06-01', 40, 4000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('007e5707-cda2-431e-9268-57135a8c5ba7', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP000636', '8934574060066', 'Kẹo C', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('e0cec79f-1a84-451c-862f-fc812516bcaf', '007e5707-cda2-431e-9268-57135a8c5ba7', 'Gói', 1, true, 4245, 6000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('a04cfb42-860b-4c10-915c-aa3a681fd32c', '007e5707-cda2-431e-9268-57135a8c5ba7', '25033KN', '2027-04-20', 0, 4245);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('4074403f-9bc6-49c3-8340-a777c8d03585', '007e5707-cda2-431e-9268-57135a8c5ba7', '0', '2027-05-30', 0, 4245);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('067ed00f-a454-438f-9194-4dc331927dc5', '007e5707-cda2-431e-9268-57135a8c5ba7', '25091KN', '2027-12-02', 72, 4245);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('44597427-3c2c-4abb-b496-1141a8197958', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP000634', NULL, 'Kẹo Sữa Ong Chúa', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('f22c6d27-23a4-4206-af94-c673a192079f', '44597427-3c2c-4abb-b496-1141a8197958', 'Lọ', 1, true, 6200, 10000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('afa3e7c5-712b-4a2d-91a7-46d7b106a36a', '44597427-3c2c-4abb-b496-1141a8197958', '04424', '2026-08-28', 0, 6200);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('4d02b091-8e78-45b7-8b57-239959fc199c', '44597427-3c2c-4abb-b496-1141a8197958', '01525', '2027-10-29', 0, 6200);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('bd77df0e-41d3-4b3a-a4e2-3ef19a0041fe', '44597427-3c2c-4abb-b496-1141a8197958', '00226', '2028-02-26', 66, 6200);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('7ac7050c-0c13-4cc8-9a7d-63027396814a', '44597427-3c2c-4abb-b496-1141a8197958', '010725', '2028-07-10', 25, 6200);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('c729fab9-5398-4070-86f7-e70a85b2ee41', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP000633', '8938555193033', 'Bông Tẩy Trang Nakori', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('cce4c434-c511-4861-be31-67711fd49b61', 'c729fab9-5398-4070-86f7-e70a85b2ee41', 'Gói', 1, true, 28000, 35000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('b2f58723-845a-4aba-942b-871f119b1330', 'c729fab9-5398-4070-86f7-e70a85b2ee41', 'NA01', '2028-02-10', 52, 28000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d90bf951-4d68-4fe1-b7b2-25ad14b8efa3', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP000632', NULL, 'Kẹo Hi Chew', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('df6ffe18-c54e-4aca-b1f4-5dcc93c6321d', 'd90bf951-4d68-4fe1-b7b2-25ad14b8efa3', 'Cây', 1, true, 12000, 20000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('97de10b9-e3c5-4245-8819-33c42cf1783d', 'd90bf951-4d68-4fe1-b7b2-25ad14b8efa3', '0', '2026-09-10', 0, 12000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('34bbcffe-716c-442a-8686-f23c9b63911d', 'd90bf951-4d68-4fe1-b7b2-25ad14b8efa3', '200225', '2027-02-20', 0, 12000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('d676b5dd-8be1-4890-a937-a38fc4a01c3c', 'd90bf951-4d68-4fe1-b7b2-25ad14b8efa3', '160725', '2027-07-16', 17, 12000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('badbbdec-ee29-4cf8-855b-95db96476c5e', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP000631', '8936220251583', 'Omega 369', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('3f89f81c-dc22-4c3b-991b-9fbf727ea197', 'badbbdec-ee29-4cf8-855b-95db96476c5e', 'Hộp', 1, true, 90000, 150000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('05e7eb12-01c3-4200-878f-baeacf59b216', 'badbbdec-ee29-4cf8-855b-95db96476c5e', '011124', '2027-11-08', 0, 90000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('d614df0d-53d1-4fde-b1c1-919920f551a8', 'badbbdec-ee29-4cf8-855b-95db96476c5e', '011125', '2028-11-01', 0, 90000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('261430c0-920a-4482-97c7-bb21f360fba2', 'badbbdec-ee29-4cf8-855b-95db96476c5e', '200126', '2029-01-20', 10, 90000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('a600ca9e-6df3-4b8d-abed-6e757b2c02c3', 'badbbdec-ee29-4cf8-855b-95db96476c5e', '01026', '2029-02-03', 0, 90000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('92058333-4459-4b4d-8737-478a1e202a19', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP000629', '8935049900016', 'Aspartam Đường Ăn Kiêng', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('6bea588d-6443-4de2-9652-58e7ee47d0fd', '92058333-4459-4b4d-8737-478a1e202a19', 'Hộp', 1, true, 33200, 40000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('12a907d5-42f5-4e4f-aae5-5f51747bb061', '92058333-4459-4b4d-8737-478a1e202a19', '0080225', '2028-02-26', 2, 33200);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('e0cf5045-1e33-4451-9a8c-2ab53c2fefa4', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP000627', '8938530908614', 'Vitamin E đỏ ch/60v', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('e04d130a-acff-4363-92d1-849a7a5a1d6f', 'e0cf5045-1e33-4451-9a8c-2ab53c2fefa4', 'Hộp', 1, true, 100000, 150000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('ef8c055c-a2cf-42bb-b1eb-954bcce0a512', 'e0cf5045-1e33-4451-9a8c-2ab53c2fefa4', '020325', '2028-03-05', 0, 100000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('e6547312-5b2e-4002-bb96-33893e693042', 'e0cf5045-1e33-4451-9a8c-2ab53c2fefa4', '080925', '2028-09-17', 0, 100000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('f1de040f-1c92-4760-840b-44787194a801', 'e0cf5045-1e33-4451-9a8c-2ab53c2fefa4', '010126', '2029-01-23', 4, 100000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('10e358db-9f1b-456d-bf34-060193ff2f75', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP000626', '8936139620630', 'Trà giảm cân Đông Dược Việt', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('22934868-dc91-4716-a480-a2b546e339d8', '10e358db-9f1b-456d-bf34-060193ff2f75', 'Hộp', 1, true, 250000, 350000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('4179732d-d299-4551-9761-a377eb535c1b', '10e358db-9f1b-456d-bf34-060193ff2f75', '0', '2027-07-19', 6, 250000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('3b330f05-7854-4a51-b301-8e6fbd249ca5', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP000625', '8938527456463', 'Vitamin E ( Vàng )', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('eb273a95-f7b4-4f00-a91c-31e62ffbc707', '3b330f05-7854-4a51-b301-8e6fbd249ca5', 'Viên', 1, true, 1000, 1350);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('bce43256-4d9d-468b-a41d-695bb23c40a8', '3b330f05-7854-4a51-b301-8e6fbd249ca5', '010723', '2026-07-24', 0, 1000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('34b8f119-ce4c-415a-a2d8-d6485605ddec', '3b330f05-7854-4a51-b301-8e6fbd249ca5', '021125', '2028-11-04', 0, 1000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('15a96de4-b2c4-45c6-8e8d-e97b478c80dd', '3b330f05-7854-4a51-b301-8e6fbd249ca5', '041225', '2028-12-12', 0, 1000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('a076923a-a703-4cf1-af4f-a35224430941', '3b330f05-7854-4a51-b301-8e6fbd249ca5', '030226', '2029-02-25', 8330, 1000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('72e4965f-4837-45bb-a233-b0e763d82f14', '5396f603-ab93-4928-af8f-d3f5b1d1fb8f', 'SP000624', '8938530372927', 'Ginkgo tốt 20k', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('564e1bb3-47ac-4aaa-8818-4e1ed4240eaf', '72e4965f-4837-45bb-a233-b0e763d82f14', 'Viên', 1, true, 1000, 2000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('68cc5f75-9d04-4617-9f11-faeefb965669', '72e4965f-4837-45bb-a233-b0e763d82f14', '0', '2028-01-01', 0, 1000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('c1de0b0b-8a22-4a8d-aeb1-44f0064ac010', '72e4965f-4837-45bb-a233-b0e763d82f14', '010225', '2028-02-09', 0, 1000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('c6a501b9-c158-40bc-bb26-1cf3a1ab3cb1', '72e4965f-4837-45bb-a233-b0e763d82f14', '080825', '2028-07-07', 0, 1000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('2cdd1dba-a9c7-4b12-9bcc-3de2904f1971', '72e4965f-4837-45bb-a233-b0e763d82f14', '021225', '2028-12-20', 0, 1000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('4c191b03-8e0e-4183-aa77-54ebb54c5f6e', '72e4965f-4837-45bb-a233-b0e763d82f14', '010426', '2029-04-01', 4770, 1000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('6fd4d1f3-6bdb-4f70-894f-ef75538f58fb', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP000619', '8850007813040', 'Listerine 250ml', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('d5c26a15-54e4-4ccf-b648-8641d4a2c8a0', '6fd4d1f3-6bdb-4f70-894f-ef75538f58fb', 'Chai', 1, true, 37000, 40000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('bd89118d-fb77-4b05-a382-36534219b3d0', '6fd4d1f3-6bdb-4f70-894f-ef75538f58fb', '5D009L', '2028-01-07', 0, 37000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('a7102a72-8379-4471-8b60-780feae30e3c', '6fd4d1f3-6bdb-4f70-894f-ef75538f58fb', '6G082L', '2029-03-21', 9, 37000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('45db03c3-610f-4055-9ab6-89a4a66ed023', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP000618', '8936206260196', 'Dung Dịch Vệ Sinh Hồng Hương', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('78a8d983-708f-4e25-801d-f761c2b12ac1', '45db03c3-610f-4055-9ab6-89a4a66ed023', 'Chai', 1, true, 40000, 60000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('59e69ab6-52d7-445e-b66f-777211659e56', '45db03c3-610f-4055-9ab6-89a4a66ed023', '1540823', '2026-08-27', 0, 40000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('7d876fd6-c0ee-47a4-853b-226132940aec', '6afa32c5-1630-49f2-9d0f-06168b96b389', 'SP000617', '8938554952006', 'Xịt Pisy Spray', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('a86aaf52-6687-4197-8619-1189e1050049', '7d876fd6-c0ee-47a4-853b-226132940aec', 'Chai', 1, true, 40000, 60000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('be7c6d1d-a6c9-446c-8311-a82dd2191bbb', '7d876fd6-c0ee-47a4-853b-226132940aec', '022024', '2027-11-04', 0, 40000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('c9b2c8c1-94c5-4d7c-8abb-c0fe43dec344', '7d876fd6-c0ee-47a4-853b-226132940aec', '012026', '2029-04-09', 15, 40000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('f2af4c7b-44a6-4211-b3f3-bfb62bbc4504', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', '8938521795001', '8938521795001', 'Snow Clear 50ml', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('92aff092-21cc-45e4-900d-698e70719868', 'f2af4c7b-44a6-4211-b3f3-bfb62bbc4504', 'Tuýp', 1, true, 54000, 60000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('2c9db1d1-523c-4c44-b645-3c10f1a72a1b', 'f2af4c7b-44a6-4211-b3f3-bfb62bbc4504', '0250325', '2028-03-13', 0, 54000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('8ea351f2-951c-4d55-9879-0986573a4bac', 'f2af4c7b-44a6-4211-b3f3-bfb62bbc4504', '0410425', '2028-04-11', 0, 54000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('a5a532d1-c660-4c85-babe-808c687c2166', 'f2af4c7b-44a6-4211-b3f3-bfb62bbc4504', '1025', '2028-10-28', 0, 54000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('e31aa46c-c52a-47be-9420-fbb84999b2c7', 'f2af4c7b-44a6-4211-b3f3-bfb62bbc4504', '0040126', '2029-01-12', 0, 54000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('d5010696-cfd4-4c0d-bca3-f8c436c42708', 'f2af4c7b-44a6-4211-b3f3-bfb62bbc4504', '0080126', '2029-01-15', 19, 54000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('56e67fd7-d692-472f-a060-25d26b3c9eaf', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP000616', '8936009151462', 'DDVS Dạ Hương', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('5f22ee1c-032a-4508-8b4e-bc8e3ec3cc2b', '56e67fd7-d692-472f-a060-25d26b3c9eaf', 'Hộp', 1, true, 38000, 42000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('a5b42907-13e2-4880-accb-4618cf20904c', '56e67fd7-d692-472f-a060-25d26b3c9eaf', 'T38', '2027-09-26', 14, 38000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('0c2f1093-9371-4e07-a353-94b8e96df485', '290d7875-db14-4fae-9b9e-7413022816c8', 'SP000615', NULL, 'V.Rohto vitamin', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('09581b8b-3cbc-4dce-8a6b-e0bd7d65cca0', '0c2f1093-9371-4e07-a353-94b8e96df485', 'Lọ', 1, true, 52400, 54000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('815cf58a-7f1a-4d8e-9620-116deaacf124', '0c2f1093-9371-4e07-a353-94b8e96df485', 'LA09', '2027-12-20', 0, 52400);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('67cf6227-e0ec-47c6-8be7-f22fe11c5760', '0c2f1093-9371-4e07-a353-94b8e96df485', 'LA14', '2027-12-26', 0, 52400);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('987127da-b376-4b26-9f01-a8f0580f057a', '0c2f1093-9371-4e07-a353-94b8e96df485', 'JB02C', '2028-10-02', 0, 52400);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('880bbf02-c53d-42f9-a7dd-a288484d0da7', '0c2f1093-9371-4e07-a353-94b8e96df485', 'lb01', '2028-12-23', 0, 52400);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('45360109-c564-4371-809b-8efdc48d3724', '0c2f1093-9371-4e07-a353-94b8e96df485', 'AC07', '2029-01-18', 0, 52400);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('0b34e4f3-d167-4f4b-a001-f8f860b70c94', '290d7875-db14-4fae-9b9e-7413022816c8', 'SP000614', NULL, 'V.Rohto Cool', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('de48cd5e-2b5d-4823-9f3d-ddf0d0401bb7', '0b34e4f3-d167-4f4b-a001-f8f860b70c94', 'Lọ ', 1, true, 58000, 59000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('1d9dab94-954d-4704-acbd-1b1d27972f85', '0b34e4f3-d167-4f4b-a001-f8f860b70c94', 'LA04', '2027-12-19', 0, 58000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('796251f9-ef46-4cd1-ab41-12932062f2b9', '0b34e4f3-d167-4f4b-a001-f8f860b70c94', 'LA06', '2027-12-21', 0, 58000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('c1682c2d-a0da-4362-b077-84619cd95e29', '0b34e4f3-d167-4f4b-a001-f8f860b70c94', 'lb02', '2028-12-17', 5, 58000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('7c70a5af-2cc7-408a-bd41-dbcec68e52c8', '0b34e4f3-d167-4f4b-a001-f8f860b70c94', 'LB06', '2028-12-18', 10, 58000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('7a5a80e0-4272-457b-ac27-1602d8249f70', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP000610', NULL, 'Bơm Tiêm 5cc', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('95f41ea7-a666-4d16-a8ce-6c4b51a83b4f', '7a5a80e0-4272-457b-ac27-1602d8249f70', 'Cái', 1, true, 667.4, 1500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                VALUES ('184bbcdc-a68b-4a32-a0ab-c3d4a52ea84c', '7a5a80e0-4272-457b-ac27-1602d8249f70', 'LO-MACDINH', '2099-12-31', 297, 667.4);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('ec22e053-e332-43e9-9aaa-e479ef937301', 'f5fd2f6d-3935-4b8d-9956-89be2e62a887', 'SP000607', NULL, 'Bơm Tiêm 10cc', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('257e55e5-85b9-43f5-a56c-5835cc378a0c', 'ec22e053-e332-43e9-9aaa-e479ef937301', 'Cái', 1, true, 1036, 2000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                VALUES ('9a294e71-8471-429b-b4cd-ffb55bf1ee70', 'ec22e053-e332-43e9-9aaa-e479ef937301', 'LO-MACDINH', '2099-12-31', 58, 1036);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('be8fc99e-b241-4ff2-85e1-4a3d13165103', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000594', '8934690001332', 'Bidisamin 500mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('081b25fb-88fb-4103-932b-12220fdc41a9', 'be8fc99e-b241-4ff2-85e1-4a3d13165103', 'Viên', 1, true, 800, 1500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('78533ed2-a097-47e7-a637-724d01a90307', 'be8fc99e-b241-4ff2-85e1-4a3d13165103', '25002', '2028-02-07', 0, 800);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('68a9037e-bf44-4935-aac4-75747c545967', 'be8fc99e-b241-4ff2-85e1-4a3d13165103', '25012', '2028-12-16', 55, 800);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('fd5b4d30-aaa5-4fed-abe7-07f575fc8e39', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000552', NULL, 'Soslac G3', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('7cad812f-034c-4732-a216-50ff6845267f', 'fd5b4d30-aaa5-4fed-abe7-07f575fc8e39', 'Tuýp', 1, true, 22800, 25000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('6be6735f-6def-425e-b3d3-78d5651ca5ee', 'fd5b4d30-aaa5-4fed-abe7-07f575fc8e39', '25034', '2028-03-27', 0, 22800);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('161f0723-a842-4670-b188-cf8aa8636000', 'fd5b4d30-aaa5-4fed-abe7-07f575fc8e39', '0', '2028-06-17', 0, 22800);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('29e98d0a-5f90-4455-90c3-b61521c4c717', 'fd5b4d30-aaa5-4fed-abe7-07f575fc8e39', '25124', '2028-12-08', 21, 22800);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('e4cb2daf-8f83-41dd-b460-11762966993c', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000550', NULL, 'Salonpas Dán', true, 'd3581860-3338-4a43-a70b-71fa47e6684b', 'Dán');
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('93d1fd30-9f63-41c1-a302-15dc2c4ef273', 'e4cb2daf-8f83-41dd-b460-11762966993c', 'Miếng', 1, true, 1300, 1500);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('2c6cf2e2-7b05-44e5-a6de-625978ae5aa3', 'e4cb2daf-8f83-41dd-b460-11762966993c', 'B8919', '2027-05-30', 0, 1300);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('af24629d-7c9d-4d27-8d26-2cac9e2bc220', 'e4cb2daf-8f83-41dd-b460-11762966993c', '0', '2027-07-01', 0, 1300);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('6e985739-daf8-4aef-af2c-1a859ca2b3d2', 'e4cb2daf-8f83-41dd-b460-11762966993c', 'B0111', '2028-01-16', 360, 1300);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d195b660-6794-4e0d-aa73-320d10defdc8', 'f59542da-6c03-46df-b056-7c26229ab118', 'SP000549', '8935049902812', 'Natri clorid 0,9%', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('c22a8765-6ed6-4911-aed4-1bf6175a53f1', 'd195b660-6794-4e0d-aa73-320d10defdc8', 'Chai', 1, true, 3080, 4000);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('72762b5f-ea3a-41a2-b008-2a6da6cc510d', 'd195b660-6794-4e0d-aa73-320d10defdc8', '3780325', '2027-09-14', 0, 3080);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('df2d687d-9eca-444c-808d-fced4200d2d2', 'd195b660-6794-4e0d-aa73-320d10defdc8', '0', '2027-10-23', 0, 3080);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('5cb74313-09ff-407d-bda7-b512e7c9bf4b', 'd195b660-6794-4e0d-aa73-320d10defdc8', '13061025', '2028-04-23', 0, 3080);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('628a03ed-3ec0-4422-8ad0-b05f691e788b', 'd195b660-6794-4e0d-aa73-320d10defdc8', '13861125', '2028-05-15', 117, 3080);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('e71533cf-bfd5-4e53-98a2-25eb8fbe196a', '6e61494e-a5d3-4dc1-a78d-05b0298b3a12', 'SP000523', '89352060162841', 'Diclofenac DHG', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('f7601df6-0e21-4426-bb66-a3cfbec70764', 'e71533cf-bfd5-4e53-98a2-25eb8fbe196a', 'Viên', 1, true, 226, 250);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('e29feb04-e431-46b0-b529-bded5c51c5dd', 'e71533cf-bfd5-4e53-98a2-25eb8fbe196a', '0', '2027-01-01', 0, 226);
INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('a1f0811c-e9d8-441b-aaa2-437d2c973184', 'e71533cf-bfd5-4e53-98a2-25eb8fbe196a', '061125', '2027-12-25', 2080, 226);

INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('383f9b75-3940-4d05-9961-bf25994ab59e', '2844c31b-275d-4f04-8708-df86b6295d10', 'Vỉ', 10, false, 13000, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('23f5a206-2091-4cbe-a60f-d3a8a1cb8195', '2844c31b-275d-4f04-8708-df86b6295d10', 'Hộp', 60, false, 78000, 120000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('55ba5f3c-577d-4153-9d8c-471995b5e4cd', 'dbcfeaff-a723-4c3f-bc7e-38c251755b50', 'Vỉ', 10, false, 10395, 15000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('7ba301df-a8bc-4f5b-9c76-fcee84e5a964', 'dbcfeaff-a723-4c3f-bc7e-38c251755b50', 'Hộp', 50, false, 51975, 75000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('cf4147ed-ab59-4655-aa7e-b36211175e19', '0416633b-8cad-49c5-a442-593b260c956b', 'Hộp', 20, false, 76500, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('19fd50c9-ebbf-4d09-8c17-af77038ef01f', '2974bab3-31a1-46d5-90c4-f5647ede02f1', 'Hộp', 3, false, 29400, 36000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('069a8bee-6842-4e85-8a4c-64cd8e3661cf', '46da20e2-9b6b-4102-872d-946e1cafc9a9', 'vỉ', 10, false, 0, 0, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('028cf578-5c4e-48a3-b85c-33007315a8fb', '46da20e2-9b6b-4102-872d-946e1cafc9a9', 'hộp', 100, false, 0, 0, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('e20942df-5b61-4be9-b673-989657e01e73', '9f4e8bfe-f045-4ba2-8d9b-4a2818e7043d', 'vỉ', 10, false, 5920, 8000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('913e0572-0268-4068-8722-943c58dd85f0', '9f4e8bfe-f045-4ba2-8d9b-4a2818e7043d', 'Hộp', 100, false, 59200, 80000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('fb4ae2f5-1fe8-45f7-8588-5108a1da3647', '909dd8bc-cd32-4f5b-b8ba-6801721323a6', 'Vỉ', 10, false, 0, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('3fe25d4b-ec53-4077-9b01-76c725c69ad6', '909dd8bc-cd32-4f5b-b8ba-6801721323a6', 'Hộp', 100, false, 0, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('c113914b-a882-41b0-9016-5c3d011a6019', '27f02204-98ff-4c99-acd2-4877d852561e', 'Vỉ', 10, false, 0, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('94704c83-cc27-4ecd-8cea-f31fd83ec8f2', '27f02204-98ff-4c99-acd2-4877d852561e', 'Hộp', 100, false, 0, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('d031bde0-aabb-468a-b15a-240f16a92041', '789ec14d-b7d1-4f75-803d-741cb528ad56', 'Hộp', 12, false, 68036.4, 78000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('af9b20fd-d413-4168-8cdc-623154097102', '44f26412-5f9a-43a5-9c20-dbdc158dd2c2', 'Vỉ', 20, false, 6000, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('2704b5cb-a1e9-4262-b29d-6b91ab6a5f02', '44f26412-5f9a-43a5-9c20-dbdc158dd2c2', 'Hộp', 300, false, 90000, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('da968b52-da02-41cf-9a57-0508742249d5', 'd209d335-0d4d-4e04-a20f-de3f54157f7f', 'Vỉ', 10, false, 4300, 6000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('e9092e36-6848-4a09-811d-9d5213251074', 'd209d335-0d4d-4e04-a20f-de3f54157f7f', 'Hộp', 100, false, 43000, 60000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('1e428fb7-9371-4d87-a9a0-5be40bbd321d', 'a21b49d7-8a4b-4827-8901-10c439cb970e', 'Vỉ', 10, false, 18000, 60000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('e771d3cc-de77-4644-93c7-46c1a4c4c7b3', 'a21b49d7-8a4b-4827-8901-10c439cb970e', 'Hộp', 100, false, 180000, 600000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('eea450e1-141b-48ab-9466-80bbdb3c2480', 'e2602a85-e544-4ec8-a308-e86fd06cc2bd', 'Vỉ', 10, false, 46800, 60000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('4b714075-cf95-4609-b124-b992aeae992b', 'e2602a85-e544-4ec8-a308-e86fd06cc2bd', 'Hộp', 10, false, 46800, 60000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('abe9f524-cc54-4266-8318-66500322e057', '45de8871-2528-43ab-ac9c-156a7b91c78b', 'Hộp', 100, false, 69000, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('eb55481f-6992-47ee-bb79-1f788c03ca20', 'c9d6ffa9-bdce-4c12-a1b8-e8b061995cc6', 'Hộp', 50, false, 492413.5, 600000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('4b101984-4ff2-47ce-9e21-a6a585940d13', '42789495-3c9e-40fe-80e2-fe02c8388c56', 'Vỉ', 15, false, 16500, 30000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('ac845246-e733-4d7b-8911-a8e0c66e08df', '42789495-3c9e-40fe-80e2-fe02c8388c56', 'Hộp', 75, false, 82500, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('632b607f-9402-4de0-a727-47b250f2602b', 'e00edc59-e2e1-46f7-b444-099ff5cf8aa8', 'Hộp', 10, false, 35000, 60000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('7f47551c-4e6b-4709-a8c7-c109381861f2', 'e00edc59-e2e1-46f7-b444-099ff5cf8aa8', 'Vỉ', 10, false, 35000, 60000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('129a3463-af87-4afe-93fb-374c5a411bc5', '3e5d6fc4-a661-4cd9-a800-d3be96d26b21', 'vĩ', 5, false, 6900, 13000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('d30f6994-4ffc-44d0-b210-997f7637f1d3', '3e5d6fc4-a661-4cd9-a800-d3be96d26b21', 'hộp', 50, false, 69000, 130000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('a75d42de-29dd-4301-ab5e-f41930c72ab9', '43d457ee-d61d-403b-96ec-d9d92c9ef864', 'Vỉ', 10, false, 10000, 15000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('db1e5e8d-b488-44e1-a46a-90e47e59b4c8', '43d457ee-d61d-403b-96ec-d9d92c9ef864', 'Hộp', 30, false, 30000, 45000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('98ee8fab-81e8-4996-a490-74e23b3e58f8', '3ab860ec-690e-44d9-bfcd-0d5d201a80c4', 'Vỉ', 10, false, 73330, 90000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('15ceef3a-5e73-47f2-b2cc-2b0239427ae7', '3ab860ec-690e-44d9-bfcd-0d5d201a80c4', 'Hộp', 30, false, 219990, 270000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('fe05678d-f709-4be8-8a99-b0463a7d7dfa', 'd394fb22-5807-4c96-ba71-23400dea4cf9', 'Vỉ', 10, false, 13000, 25000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('4689b783-9769-434c-9e38-4cedfa8e8e76', 'd394fb22-5807-4c96-ba71-23400dea4cf9', 'Hộp', 30, false, 39000, 75000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('d212b284-0e96-4c3b-8d74-010414de17ed', '2681eb25-d13d-47ad-b30f-a81c8ae0a415', 'Vỉ', 10, false, 10000, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('acdf7bb0-8552-4174-8b23-9a73f5931f8b', '2681eb25-d13d-47ad-b30f-a81c8ae0a415', 'Hộp', 30, false, 30000, 60000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('957fcfef-ec15-4311-86d2-e6772cbdb025', 'ca2b231e-6498-4a2e-999a-906f54b78270', 'Vỉ', 10, false, 24500, 30000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('c8c4548d-88f6-4a12-b168-45f6b5b9bd8d', 'ca2b231e-6498-4a2e-999a-906f54b78270', 'Hộp', 20, false, 49000, 60000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('b6f3be86-e480-4354-b9ec-f26c25822175', '21601c6c-7e9e-43e5-9e1f-f789ffc35633', 'Hộp', 15, false, 86700, 120000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('d22ff6c7-2ce9-49b5-bf4e-139a68af25c0', '79b6bf65-000f-4a64-971e-f7277bb4e14e', 'Hộp', 10, false, 10000, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('8e057637-f1d5-42d5-8ec5-464963fc04e7', '3fd854dd-2a90-4c27-986b-1c7ac092e199', 'Vỉ', 10, false, 5000, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('3cff2684-0c61-47e3-ae9c-62b4c04383b4', '3fd854dd-2a90-4c27-986b-1c7ac092e199', 'Hộp', 100, false, 50000, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('29230072-fc85-44e0-8fb0-82ee98390569', '2e55a1af-a3f5-4af1-b0ed-29911f893122', 'Vỉ', 10, false, 30000, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('d6a9d535-2c98-4c43-b35d-715b16b265ec', '2e55a1af-a3f5-4af1-b0ed-29911f893122', 'Hộp', 30, false, 90000, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('e0337f23-7a74-4019-b19d-df87fbfef9b1', 'af4d7f5e-86db-4229-b5cf-2ef0385cc7f5', 'Vỉ', 10, false, 3700, 7000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('ef0e1135-b8b3-43c6-9e0f-dbcfa9a10f61', 'af4d7f5e-86db-4229-b5cf-2ef0385cc7f5', 'Hộp', 100, false, 37000, 70000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('250d47d9-468d-4b3a-a7f7-d475957695c2', '7b48d9a8-3418-49b5-a9ef-bf506db281f8', 'Hộp', 10, false, 0, 0, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('0b2b7fd3-ea0b-457a-bd64-b31cafeab64f', '0409487f-372a-4e26-93e0-1dcc4692b550', 'Vỉ', 10, false, 40000, 60000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('26a8c0e8-5195-41a8-acc5-6bf038aecae9', '0409487f-372a-4e26-93e0-1dcc4692b550', 'Hộp', 20, false, 80000, 120000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('764e2dbc-2e00-4037-a6c0-49743a4cc948', 'bdfe6386-3af7-4784-970b-2d07d7909030', 'Vỉ', 12, false, 16800, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('719732bb-6efc-43f8-810c-e3a468b273ea', 'bdfe6386-3af7-4784-970b-2d07d7909030', 'Hộp', 24, false, 33600, 40000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('e676b892-4737-428f-8f30-3815bd3ea19c', '160d4e0a-f5c5-41e4-b0c6-cd983d44dd95', 'Hộp', 60, false, 101100, 240000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('b18731cf-20f5-4603-85a5-f3a828d48462', '160d4e0a-f5c5-41e4-b0c6-cd983d44dd95', 'vỉ', 5, false, 8425, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('a9d0bd96-edf3-4af4-95c7-7ab500b8430b', '9d95e74e-40fa-4320-8380-b4f1d25dbeb6', 'Tuýp', 10, false, 35000, 60000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('bbb9859f-9758-4cc2-b11c-fcf9839fab22', 'bacc3d15-24cc-4b95-bcad-77ea8ce3ca22', 'Vỉ', 5, false, 29750, 37500, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('569c40cf-f871-4d75-97c3-cbb13a99e276', 'bacc3d15-24cc-4b95-bcad-77ea8ce3ca22', 'Hộp', 20, false, 119000, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('ff1083b2-5fc1-4012-9c60-3b0cf91aeca3', '7d591bbf-f873-4454-8ac7-31e8e0867054', 'vỉ', 4, false, 11500, 16000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('d82e4758-58a3-4bd0-a9b5-7ccbe18462a9', '7d591bbf-f873-4454-8ac7-31e8e0867054', 'Hộp', 24, false, 69000, 96000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('1956f52e-02b1-4fa7-8851-e88c40b089f0', 'c3b7ab6a-da02-4c7b-8c6a-9b0f487ca25b', 'vỉ', 10, false, 30500, 35000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('48bab6fe-b721-43ed-813a-6e2a439678af', 'c3b7ab6a-da02-4c7b-8c6a-9b0f487ca25b', 'hộp', 100, false, 305000, 350000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('f33b07b9-043a-4f84-88d5-2d53c9054675', 'c45a53a2-00d4-4fad-b633-20e210be8dcc', 'vỉ', 10, false, 56000, 85000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('e1d6f8da-2907-40ad-b2c3-919bc3648d95', 'c45a53a2-00d4-4fad-b633-20e210be8dcc', 'Hộp', 30, false, 168000, 250000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('52650902-9f01-494f-91f2-3577c8cda2ed', '15a518c6-db4f-44e1-96f0-fbd9520d8d65', 'Hộp', 20, false, 0, 120000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('f4107fd3-45bd-48dd-9464-93ec59ac5946', 'b125e483-ed1a-4310-a91f-7bd9eb592803', 'Hộp', 5, false, 35000, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('19c8d2d8-555f-4a8b-b484-c3ea0e18c3a0', 'e5b43029-0800-4fc3-bcac-753e80232823', 'Vỉ', 14, false, 16240, 28000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('e932bdd4-2d5e-47bb-a1c0-ea0c1f30b373', 'e5b43029-0800-4fc3-bcac-753e80232823', 'Hộp', 28, false, 32480, 56000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('27e79d7e-12ec-4a96-ac6d-24723bb868f1', 'f9b0df2f-a6ad-47da-a16b-5f57414ea4f4', 'Vỉ', 10, false, 12000, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('f10b98ba-8eac-42be-9895-e3b2b2cc6f71', 'f9b0df2f-a6ad-47da-a16b-5f57414ea4f4', 'Hộp', 50, false, 60000, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('9262cc96-2806-405a-9a02-827819db227f', 'e68cebcf-70f9-4270-8939-65ddc5744793', 'Vỉ', 10, false, 3290, 5000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('c1ffa57c-0821-48fb-bd25-7c97d24ffb99', 'e68cebcf-70f9-4270-8939-65ddc5744793', 'Hộp', 100, false, 32900, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('4ac94546-85a9-43cd-8e9c-0c0b91d8c587', 'cea3060e-b02c-450f-bb4c-f49e146b3076', 'Vỉ', 5, false, 7710, 15000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('4a0cb1b0-40bc-43ea-881f-737b2680447b', 'cea3060e-b02c-450f-bb4c-f49e146b3076', 'Hộp', 50, false, 77100, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('55072110-003a-4ddb-9281-769f163311c9', '77491509-7e58-4a35-878e-812ae6b83bba', 'Vỉ', 10, false, 7000, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('a5b0dc06-2271-4133-a6f9-c3ae92313180', '77491509-7e58-4a35-878e-812ae6b83bba', 'Hộp', 50, false, 35000, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('0e1e41dc-76ff-4914-aa6a-05e0005426bb', '5cfa0b7b-5e94-4995-a085-f4868213c88b', 'Hôp', 10, false, 20000, 30000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('f6bebec7-a862-48a7-9cff-e3014ddfca22', '26ad9f0d-7971-4a71-be74-8dd405e3e343', 'Hộp', 10, false, 23000, 26000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('7ad1a348-86d3-4fee-9f43-1820d57b7c40', 'fa5649e9-5b5f-442f-a81c-a78c46b5b177', 'Hộp', 10, false, 70000, 90000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('7bc58384-95f6-4998-b370-7de1a0140425', '2e0f6bfa-507d-4d11-a0e7-1a74a072b96f', 'Vỉ', 20, false, 40000, 80000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('007dbca3-f649-4ec8-9b52-f93df21fe3f8', '2e0f6bfa-507d-4d11-a0e7-1a74a072b96f', 'Hộp', 60, false, 120000, 240000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('5138a1ae-11f3-4817-b79c-2d33479d69c4', '382996b6-76ad-4a5e-bdfb-ce5587a117c2', 'Hộp', 24, false, 46080, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('3d554acc-614f-4ba6-8963-c36f75f893e3', '53d76d12-74d0-4b61-a52e-505932e5002e', 'Vỉ', 10, false, 8500, 15000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('def10948-1b49-4487-90f0-8e2d52b4a557', '53d76d12-74d0-4b61-a52e-505932e5002e', 'Hộp', 100, false, 85000, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('e398e85e-f274-4f3f-925e-289af5844447', '01310318-dfc8-4bb7-8851-ca3ffa0b2ad2', 'Vỉ', 10, false, 65000, 70000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('1dda1daf-84ac-48bd-afe8-c7668836c159', '01310318-dfc8-4bb7-8851-ca3ffa0b2ad2', 'Hộp', 50, false, 325000, 350000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('14e2bf82-af84-40b6-bb21-b8c5a9b1a0b6', '525e6b29-136d-4ed1-bcc3-a570ae4db6d6', 'Vĩ', 10, false, 30500, 40000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('376c94d4-48a2-4cf0-820c-85d7c72cc569', '525e6b29-136d-4ed1-bcc3-a570ae4db6d6', 'Hộp', 100, false, 305000, 400000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('0ac447d5-c474-463c-9431-d406b749c577', 'ba3b81b5-098a-4565-b002-02ec9fae3869', 'Hộp', 30, false, 39000, 60000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('3f7c82db-5bd0-47f7-9f74-7200e5fc1c70', '76997f6b-0677-4d7b-b159-f639d97108fb', 'Hộp', 5, false, 25000, 35000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('3da3bc42-e921-4cbb-9d77-87ce1ae583a3', '71a654e6-a565-45e0-96cc-799ba4676c37', 'Hộp', 20, false, 110000, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('ac844a3a-e252-4db5-87ea-484f3c15c13e', 'bf3641db-dc9b-4611-95a9-57c6489af7f9', 'Hộp', 24, false, 40200, 44000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('2b2632fb-608d-495d-8f08-0227c777a136', '0144979d-efcb-4854-b7e3-3bc99ef3f541', 'Vỉ', 12, false, 4200, 6000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('18d0e282-2f5a-459e-a9e1-4b313790973e', '0144979d-efcb-4854-b7e3-3bc99ef3f541', 'Hộp', 120, false, 42000, 60000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('d06e4bd5-1ba5-4fe9-995f-4a90f6ad0e32', '812d1e75-5520-41d5-9e47-493ba27264ab', 'Vỉ', 10, false, 9600, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('0dced19e-1761-4fb4-adc1-a61867d1158d', '812d1e75-5520-41d5-9e47-493ba27264ab', 'Hộp', 100, false, 96000, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('b7efb255-aeba-4f00-991b-771028cbc724', '9065c1a5-a13b-4c4c-bcde-37f612c54b8b', 'Vỉ', 10, false, 16000, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('26bad976-7502-4c06-b6ea-ae1eb600adf3', '9065c1a5-a13b-4c4c-bcde-37f612c54b8b', 'Hộp', 180, false, 288000, 360000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('0455e429-72d5-4db9-87f2-6276fe4ff849', 'a04741fa-4e9b-4abf-be8d-f8254ea08adc', 'Hộp', 10, false, 48000, 60000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('f3b52de2-258c-4e9a-8951-266071b8f95c', 'b808c245-0a6a-4fc5-9292-f28eb9fa853d', 'Vỉ', 10, false, 31800, 80000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('83a870f8-dd60-42ba-a734-c1c1bd0794df', 'b808c245-0a6a-4fc5-9292-f28eb9fa853d', 'Hộp', 100, false, 318000, 800000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('1681b1e6-6368-4eb4-9d20-a43a06d45768', '7f2e34b5-9842-4f82-aa33-23efcac40520', 'Vỉ', 10, false, 28000, 60000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('38aad4da-9944-46bb-9a06-cb4df4620971', '7f2e34b5-9842-4f82-aa33-23efcac40520', 'Hộp', 60, false, 168000, 360000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('c6c89dfc-9c4a-4dff-a874-a89bb6138f59', '930627ac-ac4e-448e-b6d4-36eb34925da9', 'Vĩ', 10, false, 8900, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('850d57ec-f4ce-4e1c-be29-3ab82a8a942f', '930627ac-ac4e-448e-b6d4-36eb34925da9', 'Hộp', 100, false, 89000, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('9b6f0c8e-e2d4-4b82-84d8-5be273775019', '023370c1-2bf6-426c-9170-390fca26db76', 'Vĩ', 5, false, 3000, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('9e5624a3-e6c5-458e-9402-c42e3bfc2926', '023370c1-2bf6-426c-9170-390fca26db76', 'Hộp', 60, false, 36000, 120000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('66816893-9190-425c-9c59-7154e727f69e', '2b3cc9dc-aef1-45a9-a555-898561a692e7', 'Vĩ', 10, false, 3000, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('74ca213f-4cad-4cd1-9c3a-edfe4537cd5d', '2b3cc9dc-aef1-45a9-a555-898561a692e7', 'Hộp', 100, false, 30000, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('92c3c840-e24c-4b76-b893-23d4d670cd35', '723b1358-a821-404e-8208-10f553b969c6', 'Vĩ', 10, false, 3500, 5000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('11405d3f-b0de-46ab-b570-ac57113c001e', '723b1358-a821-404e-8208-10f553b969c6', 'Hộp', 100, false, 35000, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('1b397996-461d-4ed9-90e0-3f9cd8f66ad1', '4f1eda08-917c-4574-89c6-9702cf065319', 'Hộp', 100, false, 185300, 200000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('d8b33066-f50a-4c19-b95f-7a7fa77842ae', '4f1eda08-917c-4574-89c6-9702cf065319', 'Vỉ', 10, false, 18530, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('f8e6870c-ee76-482d-b1d5-8787bb415f86', '379142f3-9046-42a1-9dc1-eb56a52df9e3', 'Vỉ', 10, false, 1900, 5000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('5b317ffe-7355-4b4a-b5f6-982ba449a34a', '379142f3-9046-42a1-9dc1-eb56a52df9e3', 'Hộp', 200, false, 38000, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('807f2f55-8d35-4214-b682-0bb85a91da03', '7102cc75-a09b-4e91-8e05-1490ae18c3a4', 'Vĩ', 10, false, 5000, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('07ea12fd-4308-4b2f-857b-1d4221a5d94e', '7102cc75-a09b-4e91-8e05-1490ae18c3a4', 'Hộp', 30, false, 15000, 60000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('80d94d9a-cd2e-41b4-ad92-71684fb1b3eb', '35b156c9-e86f-498e-b1cf-d332a9bdfc51', 'Vĩ', 10, false, 2900, 5000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('356a602c-e3b4-4afe-87e7-c7c0767684f4', '35b156c9-e86f-498e-b1cf-d332a9bdfc51', 'Hộp', 100, false, 29000, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('afa13046-961e-4c79-b6f2-4189c2b7bc9d', '474709a1-1b72-41de-976d-c6afee861471', 'Hộp', 20, false, 280000, 300000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('7b1f814d-5285-4752-8323-e65c1eb00173', 'd0ddf46c-59c6-42a6-98f5-474923798318', 'Hủ', 200, false, 80000, 200000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('b40b1298-29b6-4672-ac5c-3d998e8e912e', '16864a8e-5938-40b5-9656-5ff362de397f', 'Hủ', 300, false, 120000, 300000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('987e4bd4-964c-4f67-9338-f8a0a7f36f74', 'b54766c8-dc4d-4d35-bb77-0f24f20ea135', 'Hộp', 30, false, 57000, 90000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('056a8e7d-c652-4fe7-8acd-749b08425b0c', 'b0ed36ca-fd64-47fb-b831-dc950dffe484', 'hộp', 50, false, 250000, 450000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('8c4347bb-8a6b-4883-ad86-040c4d5b197f', 'f84f0240-35fb-4c44-88aa-434891b849a4', 'Hộp', 100, false, 60000, 85000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('5f461811-4491-4d5a-8cd7-be6a748f94b6', '034618c3-89cd-46e7-8640-119de9891857', 'Hộp', 5, false, 342820, 400000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('9a6902e9-acb3-40ec-9681-1b3d314d2fdc', '8d9abef6-a80a-4eff-8e8f-469080245640', 'Lọ', 30, false, 90000, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('f5c718a0-fff2-420e-bb86-0d687cf88516', '9b4249c1-c327-4419-b7aa-64cab0384358', 'hộp', 10, false, 18200, 0, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('3fc080ed-2525-49d4-9ca2-50a259fb4d2c', '231710e5-c4e3-4e3f-bc48-2b119bfe10ea', 'Hộp', 100, false, 69900, 0, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('be37ad81-c754-489f-9b80-26e642d33b8d', '0b78a694-4e9e-4cc3-8fa1-f8e06d159227', 'Hộp', 1, false, 20000, 0, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('f6752dd7-294f-4988-bdaa-10f36b59d284', '3ff09d42-4093-41f8-a266-502e2a3e6077', 'Hộp', 100, false, 229600, 0, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('1896c83b-2c38-4c6a-8da7-ad2fe2db812f', '02b88a51-299e-4021-bd2a-f7b564e1ed30', 'Hộp', 12, false, 20700, 0, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('062a010c-9404-4054-885a-019f4ecea871', '48349b9c-9364-4923-bcd2-676591d939bb', 'Vỉ', 4, false, 4780, 6000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('46de0882-af21-4ad4-9d2a-9ad7b7061c3a', '48349b9c-9364-4923-bcd2-676591d939bb', 'Hộp', 120, false, 143400, 180000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('aa55cbe7-949c-4965-9579-7c60ed077bb9', '7875394f-9f75-4d8a-92c8-d283eaadefa1', 'Vĩ', 10, false, 10370, 15000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('0e76d264-e632-4938-a715-606750ca60c9', '7875394f-9f75-4d8a-92c8-d283eaadefa1', 'Hộp', 100, false, 103700, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('58840988-bce1-499a-8f1c-255d234d2dac', 'd0393333-d785-4acb-94cc-58092e8356f5', 'Vĩ', 10, false, 5350, 8000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('677da956-9b6c-4827-9ba1-ff2ea1527645', 'd0393333-d785-4acb-94cc-58092e8356f5', 'Hộp', 100, false, 53500, 80000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('f1d545b4-1af7-4834-880b-93664eac7c7d', '81224a9d-a64f-49f4-852c-a23c78ab5526', 'Vĩ', 30, false, 34500, 37500, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('fabc0622-ecd8-4f6a-938b-2077b9d08b46', '81224a9d-a64f-49f4-852c-a23c78ab5526', 'Hộp', 60, false, 69000, 75000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('fb32938e-c349-42b5-a7b9-5053d05c36b2', '24b0ddf5-2d78-4188-b5a0-3d9fd3bfc85b', 'Vĩ', 30, false, 108000, 114000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('27bc37b4-b223-4b42-89d7-2664cad7dcd7', '24b0ddf5-2d78-4188-b5a0-3d9fd3bfc85b', 'Hộp', 60, false, 216000, 228000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('e2a3c05a-e965-4f4a-9539-906db67760cb', '33629ba8-83fe-4a48-b461-611794d7be9d', 'Vĩ', 10, false, 17400, 19000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('e0974c83-0c15-4b3b-8519-b6db6742547a', '33629ba8-83fe-4a48-b461-611794d7be9d', 'Hộp', 50, false, 87000, 95000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('98e849ba-f363-4fcf-8602-cbeb4c1a5668', '2c2e2b4d-509a-4a65-aed8-7ef82c5cd1a2', 'Vĩ', 20, false, 68000, 70000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('90c0e994-9a2d-435c-8189-cf26fa9dde2c', '2c2e2b4d-509a-4a65-aed8-7ef82c5cd1a2', 'Hộp', 100, false, 340000, 350000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('341fd4fc-617f-470a-9f89-f80bb5901cd9', '69240ee8-3bb1-4d29-a144-8bacf86bad59', 'vĩ', 10, false, 30000, 31000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('b4ce0002-4182-4296-80eb-426423b68e63', '69240ee8-3bb1-4d29-a144-8bacf86bad59', 'Hộp', 30, false, 90000, 93000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('6526878e-ae57-424d-a5c2-2122f69c0c18', '95bc5aac-01a0-4836-b1e3-c26704e476ac', 'Vĩ', 10, false, 11330, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('c1ea3ace-d237-4c16-8f54-52c685602e4f', '95bc5aac-01a0-4836-b1e3-c26704e476ac', 'Hộp', 30, false, 33990, 60000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('3f11ee6e-b1be-4482-9b24-5a92bf2dc3c1', '238de1aa-a1ea-4244-88fc-bcdfc9702a05', 'Vĩ', 10, false, 7880, 9000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('16de6e73-4eaf-4aa8-8abc-512feea83009', '238de1aa-a1ea-4244-88fc-bcdfc9702a05', 'Hộp', 50, false, 39400, 45000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('bcbc30ca-93d6-4acf-873b-44e080f2edfa', '37f15b97-376e-4753-989d-fdc41eb693f5', 'Vĩ', 15, false, 21000, 24000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('3bcf875a-c838-4551-80ec-4493b053dd4b', '37f15b97-376e-4753-989d-fdc41eb693f5', 'Hộp', 30, false, 42000, 48000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('6448a812-c009-4272-a167-31cb91b4bc27', '8513fe8a-9e17-4610-923c-9ece138d5cb2', 'vĩ', 15, false, 23250, 25000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('dc2388de-d743-460b-8096-5a634194c418', '8513fe8a-9e17-4610-923c-9ece138d5cb2', 'hộp', 30, false, 46500, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('e02fdd7c-9fac-40a8-ab08-decf2fd1cbee', 'a38fb559-9f10-4954-9c8d-8245e34516c1', 'Vĩ', 10, false, 9000, 15000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('f4d4fb3a-9ff3-4ab7-a2a3-d4e0e7a825f7', 'a38fb559-9f10-4954-9c8d-8245e34516c1', 'Hộp', 30, false, 27000, 45000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('b36b8484-e0e8-4fad-a5a5-ee47cd495807', 'b569c212-3cd2-4180-977a-ddda452cf493', 'Vĩ', 10, false, 6500, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('477a509d-e408-43f5-bde9-4ee080649248', 'b569c212-3cd2-4180-977a-ddda452cf493', 'Hộp', 100, false, 65000, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('80730d9d-9298-4bb2-92ff-0324a9489382', '5d6f7823-2ef8-4459-9df4-cf168d74adf5', 'Vĩ', 10, false, 5000, 7000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('93d290a6-b354-4581-974a-be1dcd1d594b', '5d6f7823-2ef8-4459-9df4-cf168d74adf5', 'Hộp', 50, false, 25000, 35000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('7f50cc04-ec27-4048-a8d3-6860cbfd8fed', 'c072c271-63a4-4da5-9cf7-ada97820899d', 'Vĩ', 25, false, 18100, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('97bcee1d-46c3-47dd-ab7b-01bd2c5aeebb', 'c072c271-63a4-4da5-9cf7-ada97820899d', 'hộp', 100, false, 72400, 80000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('cce7f398-37bd-4ac1-b403-0161bd80226f', '80a7091a-0806-4a7e-be2e-de7852523d3b', 'Vĩ', 20, false, 6240, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('afd69816-32b1-4ab0-be54-e1094b8820d3', '80a7091a-0806-4a7e-be2e-de7852523d3b', 'Hộp', 100, false, 31200, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('d1f20968-417d-4566-9894-535a01564fa2', '75b75d53-4e2a-4822-99ff-1a2b2622e804', 'Vĩ', 10, false, 14000, 16000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('c8fdcab0-4b40-4821-a026-b2a392b3ecd7', '75b75d53-4e2a-4822-99ff-1a2b2622e804', 'Hộp', 30, false, 42000, 48000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('5d4bfeb3-2334-4954-afb2-2f321b440ff8', '18d985e2-07c5-4898-aa44-c5db808e3e21', 'Vĩ', 10, false, 10400, 15000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('1c056dd6-29b9-43b7-81ac-30b8e837f85f', '18d985e2-07c5-4898-aa44-c5db808e3e21', 'Hộp', 100, false, 104000, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('1f3be6b1-59b8-4537-b4e6-b1c6f3cbb72e', '95dbf8de-2ca7-4c23-b870-7ed6b7192da0', 'Vỉ', 10, false, 45400, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('5ae6a7fc-fda0-4fd8-a3c3-98718abcbe56', '95dbf8de-2ca7-4c23-b870-7ed6b7192da0', 'Hộp', 30, false, 136200, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('5aa6d808-707a-4479-8797-94f7e572559b', '6c143fd3-5fd6-49ab-918d-d038273ed919', 'Vỉ', 10, false, 66000, 70000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('f8a4df0b-fc48-4cff-b907-21671e33cc8a', '6c143fd3-5fd6-49ab-918d-d038273ed919', 'Hộp', 100, false, 660000, 700000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('396f826a-c5ed-46c5-88f9-a250b84ae652', '91d2d242-b09e-4839-bbdb-2127d387457f', 'Vỉ', 10, false, 37500, 40000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('47134683-15a0-45ab-ae85-8f7ea4eff0be', '91d2d242-b09e-4839-bbdb-2127d387457f', 'Hộp', 100, false, 375000, 400000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('16ac7f59-cb39-4629-9275-2ba9a33981b2', '6a8a3bdf-c0a3-494c-bbd3-ab18d5c97b50', 'Hộp', 100, false, 70000, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('321aef4c-b91c-48a1-9613-b453f0c78981', '6a8a3bdf-c0a3-494c-bbd3-ab18d5c97b50', 'Vỉ', 10, false, 7000, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('5721c0e1-ae74-4ffb-a4cf-4dedadb5c4a7', '11a6a33c-51c9-49e7-b271-634a9ecfa478', 'Hộp', 100, false, 152000, 200000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('d3eadaa9-8633-4883-948b-3719aa8a0e7c', '11a6a33c-51c9-49e7-b271-634a9ecfa478', 'Vỉ', 10, false, 15200, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('3d2fe745-c1a8-440c-9249-38471a488685', '2340ba5c-28ec-4387-9cc3-dfecea0c42cd', 'Vĩ', 10, false, 6800, 8000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('ed3239db-d262-4ac6-9f9b-e8abb9e7b138', '2340ba5c-28ec-4387-9cc3-dfecea0c42cd', 'Hộp', 30, false, 20400, 24000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('3ccfdd71-2f93-4bf8-be3a-d31b191bd17d', '42118e07-aae2-4ebb-b719-00d86b3be9a5', 'Hộp', 40, false, 160000, 180000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('bc4655c0-2423-43b6-b8e1-140fe379ff80', 'a87b2e23-23fe-45ec-8e93-30f36b029dda', 'vĩ', 14, false, 71890, 75000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('3389ecfa-8bce-45e2-9e2d-a6732129aa76', 'a87b2e23-23fe-45ec-8e93-30f36b029dda', 'Hộp', 14, false, 71890, 75000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('7311bf92-f066-462b-ba60-4542c2a4779c', '551b2624-1541-4494-bfdd-6de60605bb25', 'Hộp', 10, false, 42000, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('329a56ac-0c22-42bb-8125-f23c08f37398', '9ad717fa-4dae-4c5b-9d1c-b4dca32dccd9', 'Hộp', 100, false, 150000, 120000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('2a58750d-5974-4ce3-965d-d0b939fbbe92', '835a0fb2-873c-4c2b-bc29-212b7510ccbb', 'vỉ', 10, false, 8000, 12000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('c71e3f92-636f-4283-a93f-a3b2ded0bece', '835a0fb2-873c-4c2b-bc29-212b7510ccbb', 'Hộp', 100, false, 80000, 120000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('e888c83a-3f20-40e4-8612-b6d7281c109e', '8ac05bd9-aeed-44bc-a971-d311ed80c67c', 'Vỉ', 20, false, 6500, 8000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('fa0335ff-b8f5-4f87-8410-4c05a07c387d', '8ac05bd9-aeed-44bc-a971-d311ed80c67c', 'Hộp', 100, false, 32500, 40000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('4f659016-accf-4895-879c-de6bd2b306fe', '15a6b593-cb7b-4b74-9c26-11e2fcc0feca', 'Vỉ', 10, false, 43900, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('c2b69f9f-2a4a-453b-9e69-21ba3dc178bd', '15a6b593-cb7b-4b74-9c26-11e2fcc0feca', 'Hộp', 30, false, 131700, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('99344acf-f483-4f55-af88-083448752b35', '8bad3883-7fb6-42fb-8d62-e2550d86fbf1', 'Hộp', 20, false, 225700, 250000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('6f81a363-a3b2-450f-99e0-7c1f5293f92f', '8906f24b-5697-4f79-8fc5-d70ff2cef210', 'Hộp', 10, false, 70000, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('9e3be0f2-94c0-47bd-9918-c53c67b5819a', 'af952434-f527-4aff-bf88-e2815f2f6995', 'Hộp', 4, false, 32000, 120000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('3a20d4a4-eb07-4239-9926-b0dcf5e46598', '7e391bf0-603b-4dea-8c43-6369f129600f', 'Tuýp', 10, false, 70000, 75000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('a78f6761-474c-424d-909d-80bee212aa3e', '11d346c1-c559-4f1e-8030-00d0565613af', 'Hộp', 30, false, 8865000, 340000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('bd9b63ae-33bc-4328-9320-972be7921369', '2014dd11-d661-487c-8d10-2d0605a2fed7', 'Vỉ', 10, false, 5000, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('909a727d-c9ff-46be-bc02-57b2950c666c', '2014dd11-d661-487c-8d10-2d0605a2fed7', 'Hộp', 100, false, 50000, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('91619554-72e0-4f02-a2ba-73cb126c9cc7', '02562f9e-d58f-4569-82c5-1b2ce7e77e63', 'Vỉ', 10, false, 12930, 17000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('f45bc491-8d2c-40a6-a9ff-9840115f9eec', '02562f9e-d58f-4569-82c5-1b2ce7e77e63', 'Hộp', 30, false, 38790, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('400c880a-b868-4dda-b147-a9549e338e52', '67da0391-5175-4435-9c84-87ba9378ba6a', 'Hộp', 20, false, 26200, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('aa12b545-a2ac-4667-9d90-4d295ebb7822', 'c4c7f747-6995-4c2b-a5e0-431bd18c2697', 'Hộp', 30, false, 55500, 90000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('43f777ff-4f93-4415-a5d7-a863d7b1641c', 'e2f97847-270e-4dae-86c0-745bb250efbd', 'Vỉ', 10, false, 2500, 5000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('793e4649-871d-44ef-a0b4-5ae37ec6228d', 'e2f97847-270e-4dae-86c0-745bb250efbd', 'Hộp', 30, false, 7500, 15000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('477f1804-b63c-41e2-b131-322f81eb15e4', 'bccef521-e825-4a59-9b3a-67848eefc9de', 'Vỉ', 10, false, 2100, 5000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('32000333-2366-42c3-b9c6-a71896a81594', 'bccef521-e825-4a59-9b3a-67848eefc9de', 'Hộp', 100, false, 21000, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('ce4cca53-a8e6-417e-90ac-964d31b96d72', 'e560ce12-5b94-4d8b-937a-f30043611f35', 'Vỉ', 25, false, 9750, 15000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('a0b79923-904a-4892-8589-ea400f5a1b29', 'e560ce12-5b94-4d8b-937a-f30043611f35', 'Hộp', 50, false, 19500, 30000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('2102723b-7b3a-4804-839d-eda44c1e04a9', '72423edf-b0da-4fa8-9d51-e18da696a294', 'Vỉ', 10, false, 2510, 5000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('32fdb5f8-523c-44f1-867e-ab243969e68b', '72423edf-b0da-4fa8-9d51-e18da696a294', 'Hộp', 100, false, 25100, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('a34a060f-079a-4d53-bfd2-2271fdc0dc3f', '3142a7e5-21ec-44eb-84d2-9cf7c6fa39ee', 'Vỉ', 10, false, 24800, 26000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('79a92b74-d230-4d91-a81c-c530b3f27d9c', '3142a7e5-21ec-44eb-84d2-9cf7c6fa39ee', 'Hộp', 20, false, 49600, 52000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('1d5cc07b-a5be-497d-8a5f-f15ccb556054', '38dae303-db53-4eae-b29b-14482e975ffb', 'Vỉ', 10, false, 13650, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('c35d48ba-bb90-43f4-baf7-8674fdec99c2', '38dae303-db53-4eae-b29b-14482e975ffb', 'Hộp', 20, false, 27300, 40000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('730c1095-d801-4193-9327-c7d8a96e4364', '2e1a8d5a-224f-4197-9b42-289b80a0ea4a', 'Hộp', 10, false, 46000, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('0ac16c9d-27a2-476e-81ee-c0ee8be61fd0', '3eb15655-d478-48f5-8129-fe00d74858f7', 'Hộp', 20, false, 164000, 180000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('ddfa7e6a-fff9-45f5-9c48-01f4a61229de', '6562283d-14bc-4a5d-8817-fc7116a93330', 'Vỉ', 10, false, 5920, 7000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('9710ea52-6888-4678-804a-df6eccee0d41', '6562283d-14bc-4a5d-8817-fc7116a93330', 'Hộp', 50, false, 29600, 35000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('c17fe32d-0b62-48c6-96ec-3b8041412341', '241d3f61-3b38-4d26-9e16-9ee1da6cced6', 'Vỉ', 20, false, 1340, 3000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('74e0f55a-18f5-48ae-9be2-1b4cc12cfb50', '241d3f61-3b38-4d26-9e16-9ee1da6cced6', 'Hộp', 200, false, 13400, 30000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('b0af0fad-8b1d-43f0-b296-37bd256fca8b', '1b84494d-8f84-4dcb-81bc-18f41c30c4f2', 'Hộp', 20, false, 82000, 120000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('5036c1a1-4eb3-444a-8da0-7199ad0c38e0', '83afbdcd-5994-4739-8356-c3e2066ef7e6', 'Vỉ', 10, false, 7340, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('ce420c90-22ee-418f-ae4c-b7de98687b7f', '83afbdcd-5994-4739-8356-c3e2066ef7e6', 'Hộp', 100, false, 73400, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('5aa39dc8-9ed0-428a-a1c9-c5577acb9368', '0a1d4d8a-0d33-448e-bc51-5c289e724fdc', 'Vỉ', 10, false, 28500, 32000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('f2df5c14-e150-4c50-b16a-a12fa24d26b3', '0a1d4d8a-0d33-448e-bc51-5c289e724fdc', 'Hộp', 20, false, 57000, 64000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('637c326b-ce26-48f4-85c9-1f94889b49b2', '27c093ab-c399-493d-b958-b71f282760bd', 'Vỉ', 10, false, 0, 6000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('322547d1-5363-48cb-9d10-5e862d51b6d7', '27c093ab-c399-493d-b958-b71f282760bd', 'Hộp', 100, false, 0, 60000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('fba805a9-32ab-4553-8e30-528fd41886ff', 'a44bf625-a662-4050-b39a-8392f5d074c4', 'Vỉ', 10, false, 16670, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('f4fc5e27-d5ac-405c-9203-b779eb542e81', 'a44bf625-a662-4050-b39a-8392f5d074c4', 'Hộp', 100, false, 166700, 200000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('d83d6026-daed-444f-9fa6-21b49c1d1416', 'acc14d58-c171-47e4-899e-6e91b9db190d', 'Vỉ', 10, false, 2000, 5000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('b4f573e8-a08c-49b1-9af0-167b1ab5c40f', 'acc14d58-c171-47e4-899e-6e91b9db190d', 'Hộp', 50, false, 10000, 25000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('4122a913-8d4b-4dfe-a318-59bbb22ba0e1', '0b381a42-3621-4d99-bd58-19a3e62b794e', 'Hộp', 20, false, 136700, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('a5343df8-4c92-49e0-a6de-1c266bd1c44b', '2110dc69-8e0d-4ee3-bb43-625a7b732e22', 'Vỉ', 10, false, 2200, 5000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('551111d6-e6cf-4c96-b475-00d951577a4e', '2110dc69-8e0d-4ee3-bb43-625a7b732e22', 'Hộp', 100, false, 22000, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('23173981-9851-461b-bedf-c1f450360e8e', 'a906b7fb-4086-4bf6-bad9-b5959a0fdb0b', 'Vỉ', 25, false, 4600, 6250, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('3625a73a-3b78-4cfd-adc4-2b55fb050e12', 'a906b7fb-4086-4bf6-bad9-b5959a0fdb0b', 'Hộp', 250, false, 46000, 62500, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('560513f0-8b6b-4638-8fde-3d0047812eed', 'b3a08de9-59f0-46b3-a715-60e455d23a5b', 'Hộp', 20, false, 22100, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('0774593e-057c-4ecb-a09a-d5c052a77d87', 'e50f5fad-6ef4-45db-8e8a-cbcd107c3637', 'Vỉ', 10, false, 7267, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('86cc3383-67e8-4df4-a0dd-01b2358bec29', 'e50f5fad-6ef4-45db-8e8a-cbcd107c3637', 'Hộp', 30, false, 21801, 30000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('fab3dabb-0f50-4764-9f07-47aaea441dfd', '298775cf-c2ba-4bc6-92b3-c637734c60a9', 'Vỉ', 4, false, 14532, 16000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('869bdcec-af7c-41f4-b1a2-9dde8f04b5cd', '298775cf-c2ba-4bc6-92b3-c637734c60a9', 'Hộp', 48, false, 174384, 192000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('9ccbd56c-7609-4bd7-84fc-230c77dad462', '8006daae-042a-47b5-b270-d6f119207fa7', 'Vỉ', 10, false, 3290, 5000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('b2466586-a3b2-4a4c-87c8-953da3ef0246', '8006daae-042a-47b5-b270-d6f119207fa7', 'Hộp', 100, false, 32900, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('e24fee1d-1a71-4e76-8693-3ebfa038a428', 'b89320cf-3a48-4bb9-9198-18d33bb5f669', 'Vỉ', 4, false, 11872, 16000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('1d3aed4e-6879-4b1f-8bc9-5254bd8bb780', 'b89320cf-3a48-4bb9-9198-18d33bb5f669', 'Hộp', 80, false, 237440, 320000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('ee136393-a980-4cb0-9329-f9d9e94abe33', '8a34b904-18f7-420a-9fe7-a5cc3e1e6fa7', 'Vỉ', 10, false, 2060, 5000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('7141cd6e-3832-4a12-851c-9f43d9133ec6', '8a34b904-18f7-420a-9fe7-a5cc3e1e6fa7', 'Hộp', 100, false, 20600, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('5212294f-b37c-45dd-983d-bdad90991db6', 'dc885147-a7b0-4a34-aa12-6a4fc066ab54', 'Vỉ', 10, false, 7430, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('62dd2e54-d9ad-4f0c-9f2c-9ef9ccbb3a61', 'dc885147-a7b0-4a34-aa12-6a4fc066ab54', 'Hộp', 250, false, 185750, 250000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('a7ceb2ec-022b-479f-ba8e-c6df7fbda3c7', '0f7ad961-e65b-475e-aac7-c78a68f58c75', 'Hộp', 20, false, 60000, 120000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('9178d7e4-9448-4578-a5f7-da3218ddb9de', '5083c1d7-b173-4972-b703-a0e3fcc52309', 'Vỉ', 10, false, 8900, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('56195fd7-619e-4714-b265-0fda2873d22e', '5083c1d7-b173-4972-b703-a0e3fcc52309', 'Hộp', 100, false, 89000, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('ae802cea-41d8-4c1d-902f-a199c2c566dc', '2c895631-1a45-438f-ae57-b12e9e22afde', 'Vỉ', 10, false, 4250, 15000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('038442e5-4ef7-4468-a631-5c3f881e673e', '2c895631-1a45-438f-ae57-b12e9e22afde', 'Hộp', 20, false, 8500, 30000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('7e73750f-f61c-4d72-a54c-46bed3093e0d', 'de9d2863-69e3-4338-a86e-24f2c5ea7ebe', 'Vỉ', 10, false, 8310, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('ea549962-ea21-49e7-99a7-84c88f298a07', 'de9d2863-69e3-4338-a86e-24f2c5ea7ebe', 'Hộp', 50, false, 41550, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('4c24d41b-b536-46db-a8df-922290b153ea', 'cefde23c-c9ca-4c5d-bf6f-107bd8120d8d', 'Vỉ', 10, false, 8000, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('2dc16d8f-4802-4781-992e-b117915b4758', 'cefde23c-c9ca-4c5d-bf6f-107bd8120d8d', 'Hộp', 100, false, 80000, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('98e0642d-dea0-46fa-baa9-c367db3af482', '62e05f1d-5daf-4015-8a71-2a2bfb2a1028', 'Vỉ', 20, false, 3560, 5000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('55a050a6-d7a3-4f54-9dca-27a03f9af554', '62e05f1d-5daf-4015-8a71-2a2bfb2a1028', 'Hộp', 100, false, 17800, 25000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('cfc24cee-84ca-4e54-89aa-f2a592e9be98', 'f0ce3891-1d1a-4010-80ad-1e65bb82b594', 'Vỉ', 10, false, 23800, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('70c10e95-3986-4fa8-9a9e-e8707ad4d894', 'f0ce3891-1d1a-4010-80ad-1e65bb82b594', 'Hộp', 10, false, 23800, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('5879a43e-f116-4788-9c08-3bd4977acdc6', '3287dc98-5bd6-400b-9aac-7c5c7879931c', 'Vỉ', 10, false, 19380, 21000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('0619d427-3dc2-4561-9490-b93c68c72630', '3287dc98-5bd6-400b-9aac-7c5c7879931c', 'Hộp', 50, false, 96900, 105000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('7ea10b96-c096-453d-a66a-da60121b8204', '9ca12726-fd0e-4587-b993-d02a5595448f', 'Vỉ', 20, false, 76660, 80000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('a0fe447b-218a-4499-84e0-1fe7faccee86', '9ca12726-fd0e-4587-b993-d02a5595448f', 'Hộp', 60, false, 229980, 240000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('243d3579-dd92-44ca-93fd-6b7511f0db9c', 'e834d504-3efe-4814-a751-258eba57ec03', 'Vỉ', 10, false, 57000, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('686ca3f1-1956-4ad4-ad9c-695f15ef60cd', 'e834d504-3efe-4814-a751-258eba57ec03', 'Hộp', 30, false, 171000, 450000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('45b038ef-99d5-41e2-8702-d53f2e6daaf1', '77618fe2-b548-4705-b970-0f6660744328', 'Vỉ', 10, false, 40000, 43330, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('1140b790-afb4-4b53-8a77-ca0a9ba75346', '77618fe2-b548-4705-b970-0f6660744328', 'Hộp', 30, false, 120000, 130000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('18af16e5-08a4-49de-9543-54e58cac33f8', 'd5f0bef3-f422-47a4-a0d3-cf138b61befd', 'Vỉ', 10, false, 63000, 75000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('d9753dbb-9271-4741-94f5-eb600261ac92', 'd5f0bef3-f422-47a4-a0d3-cf138b61befd', 'Hộp', 10, false, 63000, 75000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('a53703fd-ba3f-47b1-bbc7-d5cdb9099a61', 'dba34ea1-a2f3-41b0-b39f-1f6be292aa20', 'Vỉ', 10, false, 8350, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('fb5c297a-3154-4575-a165-5fe71aa13a5f', 'dba34ea1-a2f3-41b0-b39f-1f6be292aa20', 'Hộp', 100, false, 83500, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('d5180c51-0bdd-4ce0-baf2-4e1716b1538a', '5441c6bf-65c9-4905-8ea1-cf2187d790ad', 'Vỉ', 12, false, 15324, 16000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('dcbf5dde-0df8-4844-b3f5-1b7439263d05', '5441c6bf-65c9-4905-8ea1-cf2187d790ad', 'Hộp', 180, false, 229860, 240000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('ae72edc8-4c1b-49f9-a427-9f6569b7e55c', 'd0b397f6-062d-4f82-bcd6-3ae86c3b2c4f', 'Vỉ', 12, false, 10500, 12000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('b9158ec8-9228-483a-b74c-10504d3205c0', 'd0b397f6-062d-4f82-bcd6-3ae86c3b2c4f', 'Hộp', 120, false, 105000, 120000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('1c5d3e25-93f3-433d-88af-fc9b8e5bd2cc', '5dd4c3bc-cc30-43a8-8acc-6b2ba8633a48', 'Vỉ', 10, false, 9600, 13000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('b2bfd45a-e0b6-404c-8d84-f2bb3d64c709', '5dd4c3bc-cc30-43a8-8acc-6b2ba8633a48', 'Hộp', 30, false, 28800, 39000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('4194e85a-fb3d-4841-92bd-dd7074c842f1', '2db0be6d-47a5-4090-8b59-f556c58fa37e', 'Vỉ', 10, false, 2360, 4000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('6d51e939-79f4-4ec9-b25e-0774d867f8c1', '2db0be6d-47a5-4090-8b59-f556c58fa37e', 'Hộp', 100, false, 23600, 40000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('796d232b-87b8-4d88-aaea-cf97dcc02847', 'd89b5975-061d-4c6f-ba81-d040f7340d59', 'Vỉ', 30, false, 90000, 93000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('4f7e0336-50b9-4b24-8223-abb4598caa05', 'd89b5975-061d-4c6f-ba81-d040f7340d59', 'Hộp', 60, false, 180000, 186000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('fa9d7475-4c98-4cfd-b65b-ba55744dba3a', '425e4233-b8b0-42dd-8ffd-81104ee5c634', 'Vỉ', 10, false, 7370, 8000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('d02f442f-68eb-4cb8-b408-ae612ecd9ebc', '425e4233-b8b0-42dd-8ffd-81104ee5c634', 'Hộp', 30, false, 22110, 24000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('1c480e75-0788-4134-bce3-c845ef0d2d3d', '95003bfd-f9ef-4bd8-af37-d2cfa36b9b7b', 'Vỉ', 10, false, 22620, 25000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('2d0596bd-5e01-4ca2-a941-26dda968554d', '95003bfd-f9ef-4bd8-af37-d2cfa36b9b7b', 'Hộp', 100, false, 226200, 250000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('79373cd8-6f05-4033-87ec-e33d7edc56b6', '3eff32a7-6778-4142-8a7c-8c45b4444b5e', 'Vỉ', 10, false, 7130, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('fec7a198-9160-4d35-8b1b-5efceff815ee', '3eff32a7-6778-4142-8a7c-8c45b4444b5e', 'Hộp', 30, false, 21390, 30000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('35a18021-9f92-4a6d-a0ac-09401c3c7975', 'b70fe559-8607-49b5-8e84-3022742ecb08', 'Lọ', 30, false, 204000, 210000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('ee0c643d-ab5a-4fcb-9f2b-bb69e26968d8', '3974f990-25b1-4000-8c97-0a1e19b884c5', 'Vỉ', 10, false, 32300, 35000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('10f82538-536f-44ef-b86e-36487289c25a', '3974f990-25b1-4000-8c97-0a1e19b884c5', 'Hộp', 30, false, 96900, 105000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('72a7c329-c665-424a-b392-dd1ac7355c66', 'fed6f22e-63dd-48ff-ba42-e377c67add06', 'Vỉ', 10, false, 21000, 25000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('60c884b8-80b0-44c5-920b-7b98238cb0f3', 'fed6f22e-63dd-48ff-ba42-e377c67add06', 'Hộp', 30, false, 63000, 75000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('44d59130-f517-46f0-888b-928014767514', '2a9d39b9-e510-43c5-a7da-029d298683e2', 'Vỉ', 10, false, 11000, 12000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('490719be-fe82-4b88-b6d9-c5a665cdff17', '2a9d39b9-e510-43c5-a7da-029d298683e2', 'Hộp', 50, false, 55000, 60000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('dde836ca-d688-4804-afa0-df7faccabef5', 'bf69054f-a4db-4ccb-ae1f-9dddd3d0b5fa', 'Vỉ', 10, false, 6610, 7000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('22fe539a-d99b-422d-9514-4f2e892710df', 'bf69054f-a4db-4ccb-ae1f-9dddd3d0b5fa', 'Hộp', 100, false, 66100, 70000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('cd0da226-2774-4d59-98e2-ac0d45016596', '716d9cb5-f049-4a0a-a3ef-f255fb2d1105', 'Vỉ', 15, false, 67500, 72000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('e5a78127-21a7-48c0-88c8-34e683e355f2', '716d9cb5-f049-4a0a-a3ef-f255fb2d1105', 'Hộp', 60, false, 270000, 288000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('91ba402a-3322-486c-a2c3-1383886cf674', 'eb2bea22-d132-407a-bb2a-ac67f08dd9e5', 'Vỉ', 14, false, 116200, 125000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('6f9bb538-0e24-4368-953d-1c5ccfa6d68b', 'eb2bea22-d132-407a-bb2a-ac67f08dd9e5', 'Hộp', 28, false, 232400, 250000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('adf575b3-7617-4c22-82da-db7155c0b25a', '3a328901-4f95-472e-be2e-780e1ff35731', 'Vỉ', 10, false, 106000, 15000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('e87b2ba7-8861-47f2-a099-220f68b9ae62', '3a328901-4f95-472e-be2e-780e1ff35731', 'Hộp', 60, false, 636000, 90000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('4783ebbe-a2bf-40a6-a928-23b57db594aa', 'de25d1a5-fe17-4dbe-88f4-ccbb95fc4282', 'Vỉ', 10, false, 0, 28300, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('f555c8cb-46f0-4725-8add-52b3d5679461', 'de25d1a5-fe17-4dbe-88f4-ccbb95fc4282', 'Hỗp', 30, false, 0, 85000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('12c8a168-35a5-4181-9f8a-27d5abcd24b5', '06ff8641-4d89-4b79-932f-4640999b084d', 'Vỉ', 10, false, 0, 60000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('3bc1aa92-72cc-460a-a64b-5b9c2f3fa636', '06ff8641-4d89-4b79-932f-4640999b084d', 'Hộp', 30, false, 0, 180000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('a7c40139-0b1e-4c3a-ad3d-52b266a4fba1', 'a3e0b798-f897-4ecb-a18a-4aa6d2aeffa5', 'Vỉ', 10, false, 14550, 17000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('365d1fd5-2a01-4163-9840-f787a4c7915f', 'a3e0b798-f897-4ecb-a18a-4aa6d2aeffa5', 'Hộp', 100, false, 145500, 170000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('b8ef51a0-eefe-4e2a-8a68-92064f050df5', '62d8eaa5-18f5-4b16-95f1-f84755fd6c35', 'Vỉ', 10, false, 24100, 25000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('e80b0f91-639c-4d4d-8efb-95d63a82e75c', '62d8eaa5-18f5-4b16-95f1-f84755fd6c35', 'Hộp', 30, false, 72300, 75000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('5e6f433a-0efb-40a5-8f7f-4a06415c70ad', '811fc7e0-4e5c-43a0-83a7-ad514d0f0a4f', 'Vỉ', 10, false, 5500, 6000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('9a1d7846-ca14-46f5-9237-911d6fd9e49f', '811fc7e0-4e5c-43a0-83a7-ad514d0f0a4f', 'Hộp', 100, false, 55000, 60000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('5ff9e833-0093-4a6e-8c70-790cb506be7a', '9b46ce44-90d7-4d7d-865a-8c650064560f', 'Vỉ', 10, false, 27800, 40000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('e8a0162b-c259-4e61-9b2c-ecc29620c982', '9b46ce44-90d7-4d7d-865a-8c650064560f', 'Hộp', 30, false, 83400, 120000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('bcb91269-2a40-4df1-8b26-16142a6d11a6', 'facc9055-fddf-4b16-864c-6509fff2f6d3', 'Vỉ', 30, false, 34410, 39000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('47ea5ea1-5061-4734-8f39-1ff004646c1d', 'facc9055-fddf-4b16-864c-6509fff2f6d3', 'Hộp', 90, false, 103230, 117000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('3f01b1d1-5808-4b6d-baf3-900e25bc035b', 'e303e95f-31d6-4ba7-813f-e0c065e218bf', 'Vỉ', 10, false, 22430, 26000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('88edf8da-be43-40b5-87a5-9e09ccc29927', 'e303e95f-31d6-4ba7-813f-e0c065e218bf', 'Hộp', 30, false, 67290, 78000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('e3f0aca2-dbe4-4f84-a719-06b51b2cb667', '39a98786-7cc1-4ed2-aa26-a512285cf24a', 'Vỉ', 30, false, 8190, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('1c945e4a-38e5-4e46-8409-6f73ff040310', '39a98786-7cc1-4ed2-aa26-a512285cf24a', 'Hộp', 60, false, 16380, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('ae4429c9-8b14-4004-a58e-b1ec0bf1c532', '41b526c0-3ad7-439a-9365-15a8679d0d33', 'Lọ', 30, false, 250410, 270000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('c6ff7e89-6b5a-45a4-a9cc-28f28f15c631', 'adeaae6d-67c0-46dc-bcec-2781edfa0eea', 'Vỉ', 10, false, 5400, 6000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('6a121321-5902-4b19-bd88-85249fbd6751', 'adeaae6d-67c0-46dc-bcec-2781edfa0eea', 'Hộp', 100, false, 54000, 60000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('c89c578e-0462-49cf-9fe2-358ba73b16a2', '1bf10fb9-fe27-44f1-990d-8b8b5a2a2bd6', 'Vỉ', 10, false, 2700, 4000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('73cfd37c-b364-4508-9cb1-317b90c976b6', '1bf10fb9-fe27-44f1-990d-8b8b5a2a2bd6', 'Hộp', 100, false, 27000, 40000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('b0bf7e4b-7d40-482e-9876-a4c18c673813', 'ea70e494-4927-4660-8a3d-4d7f65184b97', 'Vỉ', 10, false, 3280, 7500, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('0ef3b7c5-75eb-4755-abd3-47f8581157cf', 'ea70e494-4927-4660-8a3d-4d7f65184b97', 'Hộp', 20, false, 6560, 15000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('52f3ff62-bce6-42de-b743-f459a496392f', 'c553138f-987a-436a-9410-36f05e2c31d6', 'Hộp', 30, false, 245490, 255000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('d396bc92-a2f6-4f10-af0f-8b8fc2cfc50d', '07650115-82af-4372-87f6-716603e91424', 'Vỉ', 10, false, 20550, 25000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('ed6e18f4-a062-4d62-ac4e-d742b0cb37fc', '07650115-82af-4372-87f6-716603e91424', 'Hộp', 60, false, 123300, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('d6e04683-17fd-43e7-bb7f-518a2d7b62df', '87d978e9-d8e6-4170-9587-9849d0d3cfbc', 'Vỉ', 10, false, 5500, 7000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('40762a64-8148-4173-9538-5cd311931afe', '87d978e9-d8e6-4170-9587-9849d0d3cfbc', 'Hộp', 100, false, 55000, 70000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('24e25ba6-ee29-4c56-ab62-40de49bd8af7', '38054ecb-3861-4072-ab8d-25c64bfc51c9', 'Vỉ', 10, false, 36430, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('6e9436b0-a4f1-47f6-9357-ef3007706125', '38054ecb-3861-4072-ab8d-25c64bfc51c9', 'Hộp', 100, false, 364300, 500000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('a10dd69e-9dc2-45e3-87b0-d6b273ecfe2d', '318cf5f5-c63b-4608-9a6c-5e9e3f207886', 'Vỉ', 10, false, 20770, 24000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('1d93979c-6ee9-4970-9652-ab4c618224b4', '318cf5f5-c63b-4608-9a6c-5e9e3f207886', 'Hộp', 100, false, 207700, 240000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('ff3c95ca-c3bd-4da7-93bb-bc41e61b306b', '8a2ef894-7b8b-4a54-9eea-dd0899da92b8', 'Vỉ', 15, false, 11700, 15000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('b860dae2-fafc-48a8-9368-031b82d0a604', '8a2ef894-7b8b-4a54-9eea-dd0899da92b8', 'Hộp', 30, false, 23400, 30000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('db72612c-58a6-4e2b-b327-4abcac952bf9', '90569a93-435b-4ad0-a8fd-0f562898e9d1', 'Vỉ', 10, false, 8500, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('421e7332-6662-4e80-ac7f-290d1bb4201b', '90569a93-435b-4ad0-a8fd-0f562898e9d1', 'Hộp', 10, false, 8500, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('c3a95a1f-b0a2-4530-ab52-dca67fb3ee5f', '7dedabd7-2c8e-4f12-a7f9-b50484b08fcf', 'Vỉ', 10, false, 14140, 16000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('e0fbbc8c-b0ec-4a2d-bb2d-53aaf9adb705', '7dedabd7-2c8e-4f12-a7f9-b50484b08fcf', 'Hộp', 50, false, 70700, 80000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('2ed3479a-54d4-4a7a-9658-77e0c304f4ca', '02dc47dc-e5d4-4a5d-8eb3-301f16c9c824', 'Hộp', 90, false, 151290, 180000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('0d0d2ec5-3237-439a-815c-290f22ea2297', '02dc47dc-e5d4-4a5d-8eb3-301f16c9c824', 'Vỉ', 30, false, 50430, 60000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('49a52d21-b128-4d73-bbd7-92610c42bc1d', 'cb530c20-cf13-4699-a7a4-ab9a03ffeb96', 'Vỉ', 10, false, 7270, 9000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('230d9a9c-d0a3-4e67-a80c-85c619c69b41', 'cb530c20-cf13-4699-a7a4-ab9a03ffeb96', 'Hộp', 100, false, 72700, 90000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('c8a5256b-6f84-4f12-9306-6254ee1d1541', '3c2af558-f2d6-494b-aa47-0531096c933e', 'Vỉ', 15, false, 26910, 30000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('50018bba-6049-421d-81e0-064cddaa5a24', '3c2af558-f2d6-494b-aa47-0531096c933e', 'Hộp', 60, false, 107640, 120000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('d58d320d-8265-4b1d-8af2-4382a549077a', '5ebf2bff-a4b5-4d2b-9b28-874239810cc2', 'Vỉ', 14, false, 147000, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('5e3e09c6-9623-4c3c-b075-2a63a9bc12e2', '5ebf2bff-a4b5-4d2b-9b28-874239810cc2', 'Hộp', 28, false, 294000, 300000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('892962bc-4959-4261-8439-94d79b49d043', 'a7d724a5-7a34-480f-a9d2-51c876d4ea77', 'Vỉ', 10, false, 25630, 27000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('ffc662a4-b084-4729-b692-3a6cbb3f98e8', 'a7d724a5-7a34-480f-a9d2-51c876d4ea77', 'Hộp', 30, false, 76890, 81000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('ffeb365b-b3a9-44f5-9c50-a2669691382d', '5f2b0a3c-54a6-469d-b32f-c45f1e83fd29', 'Vỉ', 10, false, 13330, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('8a586f18-60bc-4ebe-928e-24c9929a4a06', '5f2b0a3c-54a6-469d-b32f-c45f1e83fd29', 'Hộp', 30, false, 39990, 60000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('0404eab9-9023-4dea-9b7b-f2fca6a54e72', '5054400c-b30a-4cf4-bbaf-307a2346dc7c', 'Hộp', 50, false, 176000, 250000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('fe1e4b95-d35e-40f0-9794-7e38b7eefacb', '08d308f2-4328-40d8-9fb7-d1f85bfedb9c', 'Hộp', 100, false, 352000, 500000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('5d463dea-6b6a-4381-a513-01639ed819cb', '79648b73-37d7-4580-9545-c1438286b75a', 'Vỉ', 12, false, 16992, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('ff455dde-f0e2-4cf6-923a-c0917748c477', '79648b73-37d7-4580-9545-c1438286b75a', 'Hộp', 24, false, 33984, 40000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('1ca52336-a661-4d92-a64a-44c023d44e20', '2a60bfda-577d-4a59-a1b9-19941bea1837', 'Vỉ', 12, false, 16992, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('c262cd94-ecb7-4337-9905-1c64541a0ebe', '2a60bfda-577d-4a59-a1b9-19941bea1837', 'Hộp', 24, false, 33984, 40000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('c3f00654-2f8d-4c3a-af17-859f1d098221', 'f2e55360-ebac-4274-8545-1cdf03797492', 'Vỉ', 12, false, 16992, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('10a529e9-27c0-4b8a-8dc5-0a8f8932c803', 'f2e55360-ebac-4274-8545-1cdf03797492', 'Hộp', 24, false, 33984, 40000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('b65c5c6e-d096-4e4c-b83c-7ef407402437', '909796fe-b36c-4c4e-9bcb-c640383747b1', 'Hộp', 100, false, 55000, 75000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('19d28767-5fb5-4b07-b200-3a5d42018a07', 'ccb2575c-9e92-45f4-8ce6-11fd6438f1f6', 'Hộp', 100, false, 50000, 67000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('8279ae80-22fe-4af3-888e-d7a63292f144', '0273588f-5558-4661-98d2-8a03643bc662', 'Vỉ', 10, false, 35000, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('46824d4f-0c4f-4bdb-8f06-db715bbc1749', '0273588f-5558-4661-98d2-8a03643bc662', 'Hộp', 30, false, 105000, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('a520c20c-9eff-420c-8c52-117df66caaec', '2bb1c374-0a20-4d37-8ae7-5b6e11822f70', 'Vỉ', 10, false, 11000, 15000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('b15e7d08-8932-4707-80a5-4cbd0ab5048a', '2bb1c374-0a20-4d37-8ae7-5b6e11822f70', 'Hộp', 100, false, 110000, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('8365f39a-1fde-4714-8340-00378d5f9dfc', '35fac359-119b-4a9e-b41e-366ae5e1153b', 'Vỉ', 10, false, 8400, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('773d401f-fde4-4171-8820-0c92eb89d001', '35fac359-119b-4a9e-b41e-366ae5e1153b', 'Hộp', 20, false, 16800, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('a8cb5b5a-4372-4180-b5fb-9038c5e84857', '4acafb81-c279-4635-9882-c083b2acd3c0', 'Vỉ', 10, false, 48330, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('eb458373-8a18-4e2c-a365-d5ad66551857', '4acafb81-c279-4635-9882-c083b2acd3c0', 'Hộp', 30, false, 144990, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('6e2c6f4b-d6a4-43ca-a863-5a6ccfd35bd6', '52a27367-82c9-41e5-a1c8-e8432a81e9b2', 'Vỉ', 10, false, 20000, 25000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('87d7dd98-a38d-471b-b19f-2c7f76ac45b5', '52a27367-82c9-41e5-a1c8-e8432a81e9b2', 'Hộp', 30, false, 60000, 75000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('9931458a-b83d-43ad-a04c-85df0c19bed8', '20173a4a-6832-4ebc-a21d-88d8c9727094', 'Vỉ', 10, false, 7000, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('36610c34-945d-43ed-9800-90031cc48519', '20173a4a-6832-4ebc-a21d-88d8c9727094', 'Hộp', 100, false, 70000, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('aa759391-7904-4b44-b111-e185c6748434', '8d9c9ee7-7aca-448d-aa95-459b80bf0b90', 'Vỉ', 15, false, 32595, 35000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('5a65ac61-16a9-4b8d-b405-4f43c37fe400', '8d9c9ee7-7aca-448d-aa95-459b80bf0b90', 'Hộp', 30, false, 65190, 70000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('5b709a6a-e18d-4ab7-813a-7add33543707', '7312db4d-a431-48c9-a0cc-a3a812e010b1', 'Hộp', 30, false, 60000, 90000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('f2846748-5ab0-4537-9d5e-ea88bdd347fc', '87bca095-6ee2-46ba-b6d3-eae2b2b07c92', 'Vỉ', 10, false, 37330, 45000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('706e5978-a7d8-4512-87da-30a33dd317af', '87bca095-6ee2-46ba-b6d3-eae2b2b07c92', 'Hộp', 30, false, 111990, 135000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('d65e20af-7c01-4c4e-8163-9e3c8ecd43de', '988e1a38-5563-4755-84a4-5e7bf207b581', 'Vỉ', 10, false, 3050, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('80b9db29-ac95-40e0-9fdf-135852d8a8cf', '988e1a38-5563-4755-84a4-5e7bf207b581', 'Hộp', 100, false, 30500, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('995e8faf-6296-4051-bc83-de193a8b7d50', '867ad4fb-d512-4387-a9ee-c08fea62b407', 'Vỉ', 10, false, 8900, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('6753d995-dec5-4358-9331-143db98d10b7', '867ad4fb-d512-4387-a9ee-c08fea62b407', 'Hộp', 100, false, 89000, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('4a7e1faa-c857-4e24-8b3c-747e2d5ea943', 'd799144e-8edf-47e8-b491-93d23ced7916', 'Vỉ', 10, false, 8140, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('b9196188-d012-4a4d-a227-636c3219f89a', 'd799144e-8edf-47e8-b491-93d23ced7916', 'Hộp', 100, false, 81400, 200000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('e616498f-24b6-45ce-900b-84d5a3411a68', '2dd1a262-7db5-4195-9d35-81758a957459', 'Vỉ', 10, false, 3500, 5000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('8981682e-3448-4986-b694-24a81a9e567c', '2dd1a262-7db5-4195-9d35-81758a957459', 'Hộp', 100, false, 35000, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('efd8096a-7179-4d5d-923a-55e46d2bde71', 'ea970697-3ebc-4956-ae44-6ad567fb43de', 'Vỉ', 10, false, 6220, 8000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('4f2541b5-29a2-42fc-b468-e4083a25a9de', 'ea970697-3ebc-4956-ae44-6ad567fb43de', 'Hộp', 100, false, 62200, 80000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('20980371-7f80-45d3-9c36-6e8e132e60f5', 'b0233dec-155a-47d4-857a-2ce97ea447e0', 'Vỉ', 10, false, 8000, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('b6ca7724-9c84-4c21-a4ec-eb7b839bfeeb', 'b0233dec-155a-47d4-857a-2ce97ea447e0', 'Hộp', 100, false, 80000, 200000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('e1df223e-d82a-4641-8caa-d1f4923f2440', '22bf3e88-1d5a-4187-8293-95dc3e80dca3', 'Vỉ', 20, false, 3000, 5000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('23cee87d-1853-4798-9e50-c63c8097f810', '22bf3e88-1d5a-4187-8293-95dc3e80dca3', 'Hộp', 200, false, 30000, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('a461effb-1ec9-4ca4-8cfc-da9c129ec263', '45368879-d0d6-4a5f-9103-8fd102355e16', 'Vỉ', 10, false, 5100, 7000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('3cdd0cbf-f182-4624-a4be-6e6f2dbcaab7', '45368879-d0d6-4a5f-9103-8fd102355e16', 'Hộp', 100, false, 51000, 70000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('a3dccf66-3cba-4bfb-a4e2-885b431f8fbf', '911d9e2e-c096-42a3-8832-bc0c5151ac88', 'Vỉ', 10, false, 10000, 15000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('2b922839-3587-4ea4-9996-cd712d00ebe9', '911d9e2e-c096-42a3-8832-bc0c5151ac88', 'Hộp', 30, false, 30000, 45000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('69935b13-7800-45fc-89ab-6b0deaa6c59d', '1d540ba7-5f4f-4e5a-9944-ba7f9cdcb8e1', 'Hộp', 30, false, 24000, 33000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('d0a0d326-53be-4efe-8a25-e3bdd384b7a4', '1d540ba7-5f4f-4e5a-9944-ba7f9cdcb8e1', 'Vỉ', 10, false, 8000, 11000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('5cf6d956-ea43-47ba-b53e-619bcd236fa2', '40e7dc59-9e29-421d-8326-3a6e7f84038b', 'Vỉ', 10, false, 8000, 15000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('8db542b4-5ba3-4e4e-bb74-24e8cd3f424a', '40e7dc59-9e29-421d-8326-3a6e7f84038b', 'Hộp', 100, false, 80000, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('fe301260-f5e3-4e17-9db4-c0f6d4150de8', 'efd5a754-9cd6-4fa4-b0c0-c452a6c462ec', 'Vỉ', 10, false, 4570, 6000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('ace64195-014b-4e1e-8210-82b43946ce0b', 'efd5a754-9cd6-4fa4-b0c0-c452a6c462ec', 'Hộp', 100, false, 45700, 60000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('cd690d5f-13fe-4c15-ab88-21bda07c9d82', '8232a1c4-1aa5-4415-844a-7a918de5a945', 'Vỉ', 10, false, 11400, 13000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('94acff05-5d59-4c0c-897e-54b736a81437', '8232a1c4-1aa5-4415-844a-7a918de5a945', 'Hộp', 100, false, 114000, 130000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('c3e3bc11-2517-4216-9730-12d037d510a4', '50a02ccc-1311-4944-bbab-b08835f664ab', 'Vỉ', 10, false, 1500, 3500, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('beb8d4f8-6aea-4743-999b-cc321b21eb00', '50a02ccc-1311-4944-bbab-b08835f664ab', 'Hộp', 100, false, 15000, 35000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('f4c8ce10-0582-4769-bf32-f07da9ab0236', 'f90d4c0d-3e60-4179-b40c-9535244357fa', 'Vỉ', 10, false, 37000, 40000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('fae6ffa1-d46a-45f4-86a7-fe672a895841', 'f90d4c0d-3e60-4179-b40c-9535244357fa', 'Hộp', 30, false, 111000, 120000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('8d2c10b4-46d9-4320-a90f-ef9c295f4cbf', 'b640a857-63dd-4597-a7a0-9594ac65476a', 'Vỉ', 10, false, 8390, 9000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('7a6b1ef3-ee82-4b76-b921-316f15eb2eda', 'b640a857-63dd-4597-a7a0-9594ac65476a', 'Hộp', 100, false, 83900, 90000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('5f618c30-bda4-4015-8687-64879aafbca6', 'd979bc0c-7509-4103-bc94-ff0d9e11ac2c', 'Vỉ', 10, false, 12080, 15000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('9b895b4f-4a85-4f36-8896-53d2622b3649', 'd979bc0c-7509-4103-bc94-ff0d9e11ac2c', 'Hộp', 10, false, 12080, 15000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('125176a8-c9d6-4013-bab1-bb2d425a23a0', '9f2610ab-b722-4637-99af-1b0d4a8e7619', 'Vỉ', 6, false, 31998, 42000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('05df977f-c50c-41dd-a401-c8d2f55a0ff8', '9f2610ab-b722-4637-99af-1b0d4a8e7619', 'Hộp', 6, false, 31998, 42000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('49c54657-8298-42ef-8425-24a1adcf3f91', '8b72ebb3-2d23-442d-bc6e-ac08981c6444', 'Vỉ', 10, false, 3500, 5000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('161bbf53-d831-47ae-9d94-1d13cabcf1ea', '8b72ebb3-2d23-442d-bc6e-ac08981c6444', 'Hộp', 100, false, 35000, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('4076eae0-15df-438b-a59e-6e994e68fecc', '1a0184c6-a130-4253-a641-5026cd39d81f', 'Vỉ', 10, false, 22640, 35000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('727151e2-29d5-4a15-8982-883f33f3c4e7', '1a0184c6-a130-4253-a641-5026cd39d81f', 'Hộp', 100, false, 226400, 350000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('aabed1af-1f70-4072-a545-efdf592ae130', 'd576b134-193c-44c2-b00c-5eb3e6669953', 'Vỉ', 10, false, 7300, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('16cf3bb8-f267-4403-a6ec-34a32519f179', 'd576b134-193c-44c2-b00c-5eb3e6669953', 'Hộp', 30, false, 21900, 30000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('5ab73c0e-e6e6-461a-9f53-c9e04c91eceb', 'e1dbb6de-05da-4b40-98d1-07d5e1359b5c', 'Vỉ', 10, false, 5070, 7000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('0938ea4a-54f1-4b1e-9dc0-8baedb78a101', 'e1dbb6de-05da-4b40-98d1-07d5e1359b5c', 'Hộp', 100, false, 50700, 70000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('23253553-d3e3-4f66-89cb-94de7d4588e0', '648b9fe1-caa0-4d83-821f-279c9bf3ec60', 'Vỉ', 10, false, 3100, 5000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('ea62792c-9ee4-4ac7-87ed-3bfc354d27ba', '648b9fe1-caa0-4d83-821f-279c9bf3ec60', 'Hộp', 100, false, 31000, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('de2edf5c-782a-4af1-aff8-d6a46335b336', '37e38300-7898-4c5f-a5f9-4ff59df6e91d', 'Hộp', 30, false, 143400, 165000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('6651cf8c-0fa7-48de-a7f3-f0c89103235c', '37e38300-7898-4c5f-a5f9-4ff59df6e91d', 'Vỉ', 10, false, 47800, 55000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('aa6a86af-1c7f-4e39-bbd8-b9adc5f86ae1', 'd7c90a00-ed9b-43fc-99c9-5bd420661e8d', 'Vỉ', 10, false, 19200, 25000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('22164e8d-44e1-49e8-8ebb-b6bbd558287f', 'd7c90a00-ed9b-43fc-99c9-5bd420661e8d', 'Hộp', 100, false, 192000, 250000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('2d29bea7-12e4-467f-8925-e64d5fe77173', '642bfc99-a00e-48ef-8261-d1b2f0cc58cf', 'Hộp', 24, false, 150600, 192000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('5180d580-c4a9-4c88-be40-d771246a52cf', '8d4c0477-7f51-4b05-bbe6-b5895504ae0c', 'Vỉ', 10, false, 18660, 25000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('9d241539-43da-48e1-9a0c-159ccfcfbaf6', '8d4c0477-7f51-4b05-bbe6-b5895504ae0c', 'Hộp', 100, false, 186600, 250000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('ea8f7b2a-0a22-488c-91b5-4a174c5dbf3f', '1407c3bf-32b8-4e66-ba16-c1b5bb5711c9', 'Vỉ', 10, false, 7400, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('e9803f1c-b822-4d29-ba1d-585bf8f6f272', '1407c3bf-32b8-4e66-ba16-c1b5bb5711c9', 'Hộp', 100, false, 74000, 200000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('33556cc4-718b-47dd-af5e-402b8d7febb2', '5d2c7ad4-e2c0-43b4-857b-fb1e60ad9138', 'Vỉ', 10, false, 7500, 15000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('d2dd801f-1277-49b1-b78d-0bc149eb3e9e', '5d2c7ad4-e2c0-43b4-857b-fb1e60ad9138', 'Hộp', 100, false, 75000, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('d0af77bd-c775-4727-94c2-ce033b48b791', '08aef492-0662-4edd-86dc-c8364ca6f0b4', 'Vỉ', 10, false, 21700, 25000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('6d101e80-898e-4b23-94ca-96f98451cd4b', '08aef492-0662-4edd-86dc-c8364ca6f0b4', 'Hộp', 100, false, 217000, 250000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('1276b5e2-f70f-4a18-88b8-3f9626d85575', '3559456e-516d-44e1-a160-041105c89482', 'Vỉ', 10, false, 4000, 6000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('56bfab4d-d71b-45d9-908c-bb5ffdaa2758', '3559456e-516d-44e1-a160-041105c89482', 'Hộp', 20, false, 8000, 12000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('c405ba10-ca5e-4921-9f96-6f62f072b0ed', 'ed89fe4c-6769-4186-b206-77789aa59d1d', 'Vỉ', 10, false, 11440, 15000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('2bd3878f-294f-4623-8b8b-6e1ceadd3950', 'ed89fe4c-6769-4186-b206-77789aa59d1d', 'Hộp', 100, false, 114400, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('987f4778-1395-4878-9ced-1bcbc23289a2', 'af8e76d1-060b-4105-ab3c-9118bc03376b', 'vỉ', 12, false, 6480, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('bc236016-bc06-4ad1-8fab-eb636a3def9f', 'af8e76d1-060b-4105-ab3c-9118bc03376b', 'Hộp', 180, false, 97200, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('6275455b-3889-42ec-989d-a180a5b9ec62', 'e286cd5e-a885-49a1-a2fe-55e295052244', 'Vỉ', 4, false, 5505.28, 8000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('f314fe91-a0a0-46be-b108-afc349fc0a14', 'e286cd5e-a885-49a1-a2fe-55e295052244', 'Hộp', 100, false, 137632, 200000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('74122dd0-17e0-49d8-b06b-32ff091597ad', '4bb45e00-0aef-47dd-a055-aae13e65d555', 'Vỉ', 4, false, 6000, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('a5582812-9684-4762-98d8-04c544210b83', '4bb45e00-0aef-47dd-a055-aae13e65d555', 'Hộp', 20, false, 30000, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('d24588f4-5f2a-4b38-9bd0-d6f6a3102b72', 'd42a2302-4c5d-42d8-8d99-6cf0110bfa59', 'Vỉ', 10, false, 2650, 5000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('38823907-dfde-4493-86d2-7cb98000448e', 'd42a2302-4c5d-42d8-8d99-6cf0110bfa59', 'Hộp', 100, false, 26500, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('5831047d-e346-4e1e-99c1-6902365c29ac', '961ccb2d-68ff-411f-8d11-d3b6037e99f3', 'Vỉ', 4, false, 5460, 6000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('598756c6-22b6-4c64-8351-5dae02a131a6', '961ccb2d-68ff-411f-8d11-d3b6037e99f3', 'Hộp', 20, false, 27300, 30000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('df3317cb-d62c-4cc3-8268-14ccf24e800c', '4a57745a-19c5-48fb-afed-214c67625d47', 'Vỉ', 4, false, 12000, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('ca094fb1-64f5-4075-9022-e5ceef25f59b', '4a57745a-19c5-48fb-afed-214c67625d47', 'Hộp', 16, false, 48000, 55000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('58ee9125-a8de-4faa-a56d-0fc7d73223b2', '894d6f10-6613-497b-b5a3-4f2ab13469e5', 'Hộp', 26, false, 102700, 130000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('3d740857-6041-49fc-a9e3-ea706a08be47', 'abe050d9-d499-4a1a-8d22-65e7d52407a4', 'Vỉ', 4, false, 4560, 6000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('1c9b649d-5a26-4a9d-8626-f20c90d4f811', 'abe050d9-d499-4a1a-8d22-65e7d52407a4', 'Hộp', 100, false, 114000, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('abe70fe6-8ed2-47dd-9513-e56bdc1bc43a', '19cc317c-33ec-4bea-b53c-4d0c60f319b8', 'Hộp', 50, false, 27600, 40000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('7dabab42-9496-41fb-aff1-b02911243037', '19cc317c-33ec-4bea-b53c-4d0c60f319b8', 'Vĩ', 5, false, 2760, 4000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('8ded7e6e-5066-4276-bdc9-38be8ceeafe0', '514c2394-03b1-4bd2-b8a3-93e07d028636', 'Vỉ', 10, false, 9900, 15000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('7928b97b-3993-4204-b67e-d019bfb3e80b', '514c2394-03b1-4bd2-b8a3-93e07d028636', 'Hộp', 100, false, 99000, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('429a3449-0abf-481e-a766-18ab690191a0', 'b865eeac-926d-4bbe-a7ab-adab3c5490bc', 'Vỉ', 10, false, 4000, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('22e76826-7bd1-4ba8-94ca-aaa79b397533', 'b865eeac-926d-4bbe-a7ab-adab3c5490bc', 'Hộp', 100, false, 40000, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('604f0d34-0212-411a-a78b-57ef6f23e27b', 'caa9f722-fdf3-459d-91fa-551e06d2fb25', 'Vỉ', 10, false, 21600, 40000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('6caa6ec6-376a-49ee-bb92-3d21a0ed20f9', 'caa9f722-fdf3-459d-91fa-551e06d2fb25', 'Hộp', 30, false, 64800, 120000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('4d7fcaf9-aee7-49a8-9d4c-b6ae4056b792', 'd7e0e6f1-6bea-4262-b706-dbe89e1cb932', 'Vỉ', 4, false, 4500, 6000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('6331210c-81ec-4000-a52b-ae6d1e81e141', 'd7e0e6f1-6bea-4262-b706-dbe89e1cb932', 'Hộp', 100, false, 112500, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('d55fb627-9200-4c82-a399-ccb5ebe7a4c0', '20a27592-9eae-4182-858b-85a9a251862a', 'Vỉ', 10, false, 10000, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('79b03502-60f0-414b-85c9-44e9dad34e45', '20a27592-9eae-4182-858b-85a9a251862a', 'Hộp', 100, false, 100000, 200000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('a2a6f152-c709-4838-9f9f-237165edbfb3', '46c27ca6-7181-4067-b2d8-1b500f111822', 'Hộp', 100, false, 2500000, 30000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('7d20977d-6e00-44f9-b6f7-dbf6f27eb0c3', '2b60882a-782b-4e61-9649-d12dca3b3b81', 'Hộp', 8, false, 232000, 272000, '8935106261128');
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('6c4b44a9-073a-403b-88af-f2307dce5dcf', 'dfb3f815-bd9a-4511-929f-bf95985130c4', 'Vỉ', 10, false, 4000, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('856f97ea-6c97-48e6-93ed-891983a33fa3', 'dfb3f815-bd9a-4511-929f-bf95985130c4', 'Hộp', 100, false, 40000, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('b51dfc5f-bc48-4792-a046-0d545ed70fe9', 'eb3e90bd-c086-47a1-a3cc-0fc9c5b97d0f', 'Lọ', 30, false, 0, 230000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('130abb69-72a9-4ec9-a560-ef7925ae4828', '7f3428f0-a78b-45d5-b864-d6b6cf92c555', 'vỉ', 10, false, 33000, 5000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('bff4d1d0-a0ee-41d3-8b33-383e36e4e8a3', '7f3428f0-a78b-45d5-b864-d6b6cf92c555', 'hộp', 100, false, 330000, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('c72df0e0-ffac-413d-aa40-596523ca808a', 'd0d3aadc-d231-45ea-bcc1-712235bfef63', 'Vĩ', 10, false, 0, 5000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('3fa78509-573b-4d1c-9812-d97c69dcaa1a', 'd0d3aadc-d231-45ea-bcc1-712235bfef63', 'Hộp', 100, false, 0, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('aa4d4429-4f5c-4331-bb14-6a7f8ff8c199', '642e49ac-ae03-40ed-a751-024a36d24bf5', 'Hộp', 3, false, 0, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('9cdb38cf-ff9f-4771-be3c-1b48d49ea58e', 'c8356cf4-ba27-4f30-a777-87dac84f3f2c', 'Hộp', 3, false, 0, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('5f7db232-599c-4a65-8a16-2e7a23fc5472', 'fd26b917-3014-4c8c-9858-b8e9cd37c708', 'Lọ', 20, false, 0, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('75fc19fc-a9eb-405d-b8f7-9a6e91b22039', '5d4c6f7a-3caa-4507-b8b9-cd4ee066ae02', 'Tuýp', 20, false, 60000, 80000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('883b560d-e035-40a3-be04-8961d2d62b4a', '249c21af-dcaf-44da-9db6-4c353986b1b6', 'Vỉ', 10, false, 0, 15000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('d7f1ef57-83bd-4d1e-9686-b44e2038739e', '249c21af-dcaf-44da-9db6-4c353986b1b6', 'Hộp', 20, false, 0, 30000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('efaeb007-af25-4b90-b54c-33fb1ca604d6', '1904587c-a8e4-4c26-88e3-f6f8ca28edf2', 'Vỉ', 10, false, 0, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('21a7d03e-2f70-49d6-8309-3e138c965918', '1904587c-a8e4-4c26-88e3-f6f8ca28edf2', 'Hộp', 100, false, 0, 200000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('dfb0c93e-8629-46f3-9122-3fb06420b404', 'ccf8a477-7f03-4773-af53-de328f59a488', 'Hộp', 12, false, 0, 60000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('4221e0d8-5a15-497f-bfd9-e0ac6fbd3b6c', 'f00350b3-b9d9-4ac2-a213-40cdc17a588d', 'Hộp', 20, false, 200000, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('a3a2355f-5da3-4d8a-a9aa-9d9638a7bdd2', '6482ff9c-9c24-461f-b016-06970646b7d3', 'Hộp', 6, false, 22458, 25000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('2368dadf-bec4-4a5a-9685-d34ca376d046', 'f3495974-bb08-4cd5-b7e6-d8e2236b7ef5', 'Vỉ', 10, false, 1679000, 58000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('164400f6-1ec4-48e7-8ac7-65bfb3657e5f', 'f3495974-bb08-4cd5-b7e6-d8e2236b7ef5', 'Hộp', 30, false, 5037000, 170000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('43d74724-3668-445b-a3a4-0a86bc795684', 'a0e2708c-0cb8-42d2-99e4-27a315adcabc', 'Vỉ', 10, false, 30040, 32000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('754d3314-d4e1-4caa-9483-846ec60e93b7', 'a0e2708c-0cb8-42d2-99e4-27a315adcabc', 'Hộp', 50, false, 150200, 160000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('3a63df72-908b-4b5c-b09c-64e69e214c64', '1d968290-2804-4349-951e-f43c5bb82926', 'Vỉ', 20, false, 21670, 24000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('cf3d13e9-6ee8-4b9d-ab40-99acf6e09772', '1d968290-2804-4349-951e-f43c5bb82926', 'Hộp', 100, false, 108350, 120000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('f6c20091-0a0d-49d7-a87b-000487387b6f', '1d814bf1-0471-4ff7-9ccc-dae05a01ebf4', 'Vỉ', 10, false, 10000, 15000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('18572a11-3df8-49ac-a020-b46af933828c', '1d814bf1-0471-4ff7-9ccc-dae05a01ebf4', 'Hộp', 100, false, 100000, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('f2206f70-7515-4f6f-90e6-bd91774c7dd8', '2998a675-52af-4c46-bbdb-56269915df4c', 'Vĩ', 10, false, 6000, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('65809b29-584b-495c-ac77-cac499e32905', '2998a675-52af-4c46-bbdb-56269915df4c', 'Hộp', 100, false, 60000, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('1993af73-c521-4c08-a377-eed5fa7b5d04', '877383bb-0e0e-4bec-9033-da02b6588d70', 'Vỉ', 10, false, 20000, 40000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('710f24f8-ed69-4eb3-a90f-875048771e0f', '877383bb-0e0e-4bec-9033-da02b6588d70', 'Hộp', 30, false, 60000, 120000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('f62b2df0-1989-4f09-a73a-6ace67057654', '94640309-760f-4a9e-87cd-3f0b98b7b84f', 'Hộp', 3, false, 21000, 30000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('86730ce9-34f2-4444-a8b7-c29ad377c1ea', 'ea6112f0-c39f-45fa-8a7e-b98dade263f8', 'Vĩ', 10, false, 2800, 5000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('7ea7e502-c399-45f6-8cd8-13b405fd3a5e', 'ea6112f0-c39f-45fa-8a7e-b98dade263f8', 'Hộp', 100, false, 28000, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('1fc2aed9-e0d2-47c9-8213-a8eff05ecfe9', 'ad0d1e05-0d4b-41a4-b23c-bd93349da258', 'Hộp', 10, false, 31000, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('819404db-3704-4f86-947a-80fb1c539207', 'e2948b24-72fa-46db-bb56-f453954c3ace', 'Hộp', 20, false, 0, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('a41fde91-179c-472d-8f49-344e6e83448b', '41c3b05b-ed05-4b59-9ddb-1cb98ecb6797', 'Hộp', 20, false, 60000, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('14cc80d6-656b-4625-927b-ae76254d0833', '8d472d6b-c646-4d77-84a9-8dea2bb592cf', 'Hộp', 20, false, 80000, 120000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('95157d71-9379-417a-ae0c-3fd599bfffa3', '8b200b3e-082d-4bab-9353-026041f1e77f', 'Hộp', 20, false, 100000, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('8e7cc61d-fda9-4ed4-a747-6bd75adf4838', 'f0dd810e-bccb-42a1-b6ba-75de1c281fe2', 'Hộp', 5, false, 20000, 35000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('5872fbea-b975-4a7b-9a00-60faf2b49321', '3b330f05-7854-4a51-b301-8e6fbd249ca5', 'Vĩ', 10, false, 10000, 13500, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('b475598a-0300-4436-a356-4719781d1502', '3b330f05-7854-4a51-b301-8e6fbd249ca5', 'Hộp', 30, false, 30000, 40000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('2af48ba3-dd61-44ac-89c0-892dac8e095f', '72e4965f-4837-45bb-a233-b0e763d82f14', 'Vĩ', 10, false, 10000, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('dd759759-e1ef-409d-829d-94a8abef4856', '72e4965f-4837-45bb-a233-b0e763d82f14', 'Hộp', 100, false, 100000, 200000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('212f74bb-ed17-491b-860b-17ae53ae3e93', '7a5a80e0-4272-457b-ac27-1602d8249f70', 'Hộp', 100, false, 66740, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('96a93d5d-75d9-4760-a5dc-55c44f903224', 'ec22e053-e332-43e9-9aaa-e479ef937301', 'Hộp', 100, false, 103600, 200000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('6df13a3d-eff7-425b-8b88-03e387e6ce62', 'be8fc99e-b241-4ff2-85e1-4a3d13165103', 'Vĩ', 10, false, 8000, 15000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('7556a19c-8734-40f9-92a6-8efe6d70fef3', 'be8fc99e-b241-4ff2-85e1-4a3d13165103', 'Hộp', 100, false, 80000, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('91949759-92de-464b-8110-4c13d84afa78', 'e4cb2daf-8f83-41dd-b460-11762966993c', 'Gói', 10, false, 13000, 15000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('ace05259-d932-4c7c-b373-66ddeacc8d37', 'e4cb2daf-8f83-41dd-b460-11762966993c', 'Hộp', 20, false, 26000, 30000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('3a3069bd-d477-4fe5-a5f4-4c3bdc9caabe', 'e71533cf-bfd5-4e53-98a2-25eb8fbe196a', 'Vỉ', 10, false, 2260, 2500, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('f932badc-2a3c-4371-aaef-1a65091e7306', 'e71533cf-bfd5-4e53-98a2-25eb8fbe196a', 'Hộp', 100, false, 22600, 25000, NULL);

COMMIT;
