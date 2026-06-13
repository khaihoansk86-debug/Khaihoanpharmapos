-- Script tự động tạo từ file Excel
BEGIN;

INSERT INTO public.categories (id, name) VALUES ('c4ec852b-1bee-40b4-8477-431921cc8073', 'Thuốc');
INSERT INTO public.categories (id, name) VALUES ('ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'Thực phẩm chức năng');
INSERT INTO public.categories (id, name) VALUES ('dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'Vật tư y tế');
INSERT INTO public.categories (id, name) VALUES ('21a20902-7d3b-443c-89ae-9ebc911810ff', 'Mỹ Phẩm');
INSERT INTO public.categories (id, name) VALUES ('920e490d-b1d8-4775-9677-34874f9458b2', 'Thuốc cắt liều');
INSERT INTO public.categories (id, name) VALUES ('80b8c40b-e414-4042-87ef-8ed5adff3c81', 'Thuốc dùng ngoài');
INSERT INTO public.categories (id, name) VALUES ('bcdbf0bd-cdd8-4e67-87eb-c654494ef3bb', 'Kẹo ngậm');
INSERT INTO public.categories (id, name) VALUES ('bd0319ff-7f2e-4c9f-9c57-245a9d02c38d', 'Nước súc miệng');
INSERT INTO public.categories (id, name) VALUES ('9e29a9dd-cf18-48f5-b0c8-610b9d52910b', 'Thuốc mỡ tra mắt');
INSERT INTO public.categories (id, name) VALUES ('b96408e2-de7a-4f65-b5f7-72b5bfd47d9f', 'Thuốc nhỏ mắt');

INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('78f50102-dd61-476b-a9b7-16abee18bd0e', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP188041', NULL, 'Zopiclon', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('56c61bab-95b8-4a87-8158-99441ca47708', '78f50102-dd61-476b-a9b7-16abee18bd0e', 'viên', 1, true, 1300, 2000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('551bf49b-699f-4511-af53-48c243203de7', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP188038', NULL, 'Philclonestyl', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('b2b5182f-97aa-4fba-80a7-2e13c3f2ff68', '551bf49b-699f-4511-af53-48c243203de7', 'viên', 1, true, 1039.5, 1500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('aa7963e6-e8e7-4cca-b88f-6b7fcb6f65f3', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP188035', NULL, 'Sắt Ông Ferro - Kids', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('140616b4-879a-4160-a938-d074494a163f', 'aa7963e6-e8e7-4cca-b88f-6b7fcb6f65f3', 'Ống', 1, true, 3825, 7500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('975fb319-f9bd-4148-8575-ee8a31ebf076', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP188033', NULL, 'Dán Hạ Sốt Chikori', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('516dbf68-16d2-4f35-ad89-d84e6704aa57', '975fb319-f9bd-4148-8575-ee8a31ebf076', 'Gói', 1, true, 9800, 12000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('0ee96037-903c-4495-b92c-5d3c8115f604', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP188032', NULL, 'Tăm Bông Tốt', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('ea0c7151-0a53-4b86-8512-ea9760aaffc4', '0ee96037-903c-4495-b92c-5d3c8115f604', 'Gói', 1, true, 4200, 7000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('a40bdfa9-839c-49b4-a89c-5ea5eba3bd72', '21a20902-7d3b-443c-89ae-9ebc911810ff', 'SP188031', NULL, 'Cao bạch hổ', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('5ce0efe7-2cab-426f-ac76-07068658981b', 'a40bdfa9-839c-49b4-a89c-5ea5eba3bd72', 'Hộp', 1, true, 0, 25000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('8f8b9fa8-9883-4937-8ed2-bc12600cd22e', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP188030', NULL, 'Siro ho (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('ac12dd44-9bfa-4124-b872-a6dd132f3f06', '8f8b9fa8-9883-4937-8ed2-bc12600cd22e', 'Gói', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('4af2fe77-9dc0-4bcb-a56e-7b571c4ba429', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP188029', NULL, 'Sulpiride 50mg (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('0a055f60-cbc7-4677-9b86-251544128444', '4af2fe77-9dc0-4bcb-a56e-7b571c4ba429', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('3433d89f-da8e-408a-8a65-089209ffa4eb', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP188028', NULL, 'Homtamin gingseng (cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('59231eec-dfa1-4f31-b994-0ecde2f52113', '3433d89f-da8e-408a-8a65-089209ffa4eb', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d9a658d8-ae75-4844-bfce-5daee4034870', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP188027', NULL, 'Celecoxib (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('4974a5e3-1483-4a46-b37d-42e4951afc78', 'd9a658d8-ae75-4844-bfce-5daee4034870', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('9c8debb5-316c-4d7a-be13-bf5cb95f9638', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP188026', NULL, 'Ho xanh (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('95b45337-94f6-4dc7-a89c-695b6921ea6d', '9c8debb5-316c-4d7a-be13-bf5cb95f9638', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('f3d6ff32-e7e5-4b9a-8a24-a2c84ee1ea44', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP188025', NULL, 'Amoxicillin 500mg + Acid clavulanic 62.5mg (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('e8413096-a7a9-416f-a7e1-ae4cb79674ad', 'f3d6ff32-e7e5-4b9a-8a24-a2c84ee1ea44', 'Gói', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('94524cf3-ab9f-4ff7-bd76-f97f2bdf817f', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP188024', NULL, 'Amoxicillin 250mg + Acid clavulanic 31.25mg (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('83fa4639-56a1-4949-a86f-ffbcbcc66a86', '94524cf3-ab9f-4ff7-bd76-f97f2bdf817f', 'Gói', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('c6c4eb29-ecd1-46dd-8225-ef4b02f22b34', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP188023', NULL, 'Cephalexin 500mg (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('3812a283-524e-4bb0-b358-496dac7d0caa', 'c6c4eb29-ecd1-46dd-8225-ef4b02f22b34', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d43fb123-b4d9-4a92-8a5f-64337cd2e29f', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP188022', NULL, 'Eperison (cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('606c1d04-a9bf-4a9d-91ab-4dfe5793e0d2', 'd43fb123-b4d9-4a92-8a5f-64337cd2e29f', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d2fb340f-36d7-444a-995f-02079630f08c', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP188021', NULL, 'Cefixime 100mg GÓI (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('bc052f66-1066-4839-a7ab-b251c27b5bdc', 'd2fb340f-36d7-444a-995f-02079630f08c', 'Gói', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('6e8ffa12-9f6f-4d4e-9c56-a62867353289', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP188020', NULL, 'Cefixime 100mg VIÊN (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('427b1631-c46a-419d-8876-738115a8b5e8', '6e8ffa12-9f6f-4d4e-9c56-a62867353289', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('211504b7-a778-4f41-b90c-ff79949b84ff', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP188019', NULL, 'Cefixime 200mg (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('cc124000-e630-4b44-bded-1e4b9ca0df25', '211504b7-a778-4f41-b90c-ff79949b84ff', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('7ac70b83-65f8-479f-8d6e-3b81e9ac3057', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP188018', NULL, 'Betamethason 0.25mg + Dexclorpheniramine maleate 2mg (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('a7b86f38-8aef-4fee-a2e2-67811accd652', '7ac70b83-65f8-479f-8d6e-3b81e9ac3057', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('3a641516-d0ac-4f29-86d3-f44824b15e76', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP188017', NULL, 'Cotrim (Cắt Liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('c9493d55-fe55-4f5c-98bd-ad5bd624f312', '3a641516-d0ac-4f29-86d3-f44824b15e76', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('b2a9559f-178d-488d-8c39-8a8fc85957a1', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP188016', NULL, 'Clindamycin 300mg (Cắt Liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('c8b00c79-5f3b-43b8-a13b-a5e51f7c214e', 'b2a9559f-178d-488d-8c39-8a8fc85957a1', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('a3c2348e-046f-4434-935f-8c23daf10c78', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP188015', NULL, 'Alphachymotrypsin 4200 (Cắt Liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('3078cd31-d3a1-4b0f-b77c-6f31f119dbff', 'a3c2348e-046f-4434-935f-8c23daf10c78', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('84d26afe-987f-462f-9a30-4e238a507300', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP188014', NULL, 'Acid mefenamic 500mg (Cắt Liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('d2d9ffc1-7640-4ecc-8544-b8943bf0dd2c', '84d26afe-987f-462f-9a30-4e238a507300', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('761f8b11-0672-437b-bc15-35b7b8322afe', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP188013', NULL, 'Cà gai leo (Cắt Liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('fee83810-da3b-4fc1-bb0b-120c9a33fd30', '761f8b11-0672-437b-bc15-35b7b8322afe', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('e39af53b-85ee-4009-bbb6-d52d41486ada', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP188012', NULL, 'Lincomycin (Cắt Liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('5b00b65c-9bee-478f-9fee-88f3bfa78c77', 'e39af53b-85ee-4009-bbb6-d52d41486ada', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('424400c2-eda3-466a-b2fd-419cf4c4bf4e', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP188011', NULL, 'Paracetamol 500mg + Phenylephrin 10mg + Loratadin 5mg (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('23ae90f3-e367-44d7-9ccb-b9e483d0ed7a', '424400c2-eda3-466a-b2fd-419cf4c4bf4e', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('25f035ce-a23d-4e36-864c-0af3a9f6f08c', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP188010', NULL, 'Prednisolon 5mg (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('518555c5-f44e-4a98-acf3-1289c834294a', '25f035ce-a23d-4e36-864c-0af3a9f6f08c', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('c6a23a8d-e313-412d-b089-0e729a3df830', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP188009', NULL, 'Allopurinol (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('9c41e554-dc74-4818-bef6-6528174cf1bd', 'c6a23a8d-e313-412d-b089-0e729a3df830', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('c568666a-0845-4ba2-869f-25dbaba76dbb', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP188008', NULL, 'Paracetamol 500mg + Codein 30mg (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('0a02ea0f-e6cb-46c8-91a0-2eac1eb67406', 'c568666a-0845-4ba2-869f-25dbaba76dbb', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('cf5393ba-ae4b-4ce0-882a-0bbde56ce3bc', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP188007', NULL, 'Paracetamol 250 (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('b1ca99f3-56e2-48bc-a267-a940ebd7d30d', 'cf5393ba-ae4b-4ce0-882a-0bbde56ce3bc', 'Gói', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('5e3bca28-961c-4d85-bcb6-c6c2a5368ba6', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP188006', NULL, 'Paracetamol 650 (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('be4fdb8c-a020-41aa-952e-6faec7801f96', '5e3bca28-961c-4d85-bcb6-c6c2a5368ba6', 'Viên', 1, true, 538.65, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('937c8435-3a6a-4980-bf89-a6e0d257559d', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP188005', NULL, 'Paracetamol 500 (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('67f07a89-5c51-4380-86b5-8454d5ce723a', '937c8435-3a6a-4980-bf89-a6e0d257559d', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('231d9d79-bc1b-428d-8a23-167d8e49d455', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP188004', NULL, 'Paracetamol 150 (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('08da8c07-3089-4b0d-8e65-b7935d9457f5', '231d9d79-bc1b-428d-8a23-167d8e49d455', 'Gói', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('9bcb394d-2232-4913-b403-f671695ec703', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP188003', NULL, 'Methylprednisolon 4mg (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('f65bb48b-238e-44db-9c33-efd345bf7b84', '9bcb394d-2232-4913-b403-f671695ec703', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('b05a6049-b5a4-4c93-822d-6ff814253ff5', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP188002', NULL, 'Methylprednisolon 16mg (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('cb6d4e6c-1322-4c00-a854-d624fa1e4962', 'b05a6049-b5a4-4c93-822d-6ff814253ff5', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('259459a9-efdf-4eb9-83b8-e5e7e7957f6e', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP188001', NULL, 'Paracetamol +Tramadol (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('3fbc0794-c8ca-4a37-802c-fcf979791a2f', '259459a9-efdf-4eb9-83b8-e5e7e7957f6e', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('c55db788-245c-4a21-af87-339bcfa259e4', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP188000', NULL, 'Vitamin PP (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('9d10e076-b1f9-4c1e-a577-2c95a77145d7', 'c55db788-245c-4a21-af87-339bcfa259e4', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('4bf793a8-7f00-4e73-9439-2c24fd2937cf', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP187999', NULL, 'Vitamin AD (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('68a2a57b-9483-43c9-9e27-59b8a6067864', '4bf793a8-7f00-4e73-9439-2c24fd2937cf', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('b9ce4891-7407-47bf-8a9a-57777a407c35', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP187998', NULL, 'Vitamin 3B (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('40ceb5d5-1be2-4f9d-a9f9-e91c8e20bb32', 'b9ce4891-7407-47bf-8a9a-57777a407c35', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('ee316b9b-5b4b-49e9-ad35-98a1f452d0d4', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP187997', NULL, 'Magnesium B6 (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('4ba3459b-995e-4748-bb1d-3a9485431356', 'ee316b9b-5b4b-49e9-ad35-98a1f452d0d4', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('b0e0614c-f3fc-4911-9fc8-0a2a7b4283fc', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP187996', NULL, 'Calci (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('bc9b20e3-4522-4308-8fa9-2aab7b058453', 'b0e0614c-f3fc-4911-9fc8-0a2a7b4283fc', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('cd1c9d09-7073-4cbe-a147-3d4b971fd88d', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP187995', NULL, 'BC Complex (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('35451aec-2155-45d5-87d6-8dc7b5797c94', 'cd1c9d09-7073-4cbe-a147-3d4b971fd88d', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('427bacae-6c6a-4091-951a-fc700871dc92', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP187994', NULL, 'Simethicon 80mg (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('920861ff-df8f-4ac1-82e7-e2e4cd6c765c', '427bacae-6c6a-4091-951a-fc700871dc92', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('167e760a-2862-4318-be71-29830190eb73', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP187993', NULL, 'Omeprazol 20 (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('5cb1ad34-9483-4a86-87d8-05e695615333', '167e760a-2862-4318-be71-29830190eb73', 'viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('30330f54-28ca-4782-b0e7-2adf02cf3b68', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP187992', NULL, 'Esomeprazol (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('d4c0827b-f2d3-4237-8f51-64546294cea8', '30330f54-28ca-4782-b0e7-2adf02cf3b68', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('bc75156a-a7a2-4a13-91c6-eaf7cd69726c', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP187991', NULL, 'Domperidone 10mg (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('37a05eac-742d-4916-98e9-d41b32fabc42', 'bc75156a-a7a2-4a13-91c6-eaf7cd69726c', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('4f1a4fc6-cfb0-43b0-92b3-0f0c7854b576', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP187990', NULL, 'Domperidone 5mg (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('f698a2c4-583e-4f76-b439-526bab27b495', '4f1a4fc6-cfb0-43b0-92b3-0f0c7854b576', 'Gói', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('9e0c5786-b17f-4b4e-9ddd-c55ee9fae915', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP187989', NULL, 'Diosmectit 3g (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('c94ef7ec-6373-4237-86d5-ef310d0f808a', '9e0c5786-b17f-4b4e-9ddd-c55ee9fae915', 'Gói', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('7cebffb5-492f-4b09-a075-a86129d6dcc7', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP187988', NULL, 'Alverin citrat (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('d5f85fbd-0f5a-4d04-a72f-db98c243d900', '7cebffb5-492f-4b09-a075-a86129d6dcc7', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('4f7fbd25-e732-49f1-ac64-42cfa54587cd', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP187987', NULL, 'Piracetam (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('0756b684-65c0-466b-ac2e-81a2d52c67fc', '4f7fbd25-e732-49f1-ac64-42cfa54587cd', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('b625e025-a849-4003-ac94-2e908f5235a5', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP187986', NULL, 'diphenhydramine (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('d219de4e-a956-4f26-abc9-299453ea7ecc', 'b625e025-a849-4003-ac94-2e908f5235a5', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('0b808921-1685-4e49-a055-c1f3fa010e65', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP187985', NULL, 'Cinnarizine (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('f69cb9fb-82bf-4fe2-9de7-bbde21602f79', '0b808921-1685-4e49-a055-c1f3fa010e65', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('2c767be8-f036-46f4-977d-84b17791bc08', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP187984', NULL, 'Montelukast (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('9babe1f6-8d03-4d9d-a87c-a56b9002d0e6', '2c767be8-f036-46f4-977d-84b17791bc08', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('b9bfc370-28ad-4dd7-9dc7-66bd1ce62209', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP187983', NULL, 'Midasol (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('194b15f8-7e24-471e-aeb0-61a4404651fb', 'b9bfc370-28ad-4dd7-9dc7-66bd1ce62209', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('fb29f538-6b04-4ae8-979a-dbbaae31b9c6', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP187982', NULL, 'Flunarizine (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('1ce3f344-2954-4132-9f96-ed206f756049', 'fb29f538-6b04-4ae8-979a-dbbaae31b9c6', 'viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('f4e20918-581f-4597-a18f-81f99c55d2de', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP187981', NULL, 'Salbutamol (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('39028a2c-fac3-4a20-b6ba-c12370702c82', 'f4e20918-581f-4597-a18f-81f99c55d2de', 'Viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('bf818907-d9f8-49fd-b345-6752a3a8fd29', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP187980', NULL, 'Men vi sinh (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('cd363c04-1c98-4ecc-b213-3e8ddc30628c', 'bf818907-d9f8-49fd-b345-6752a3a8fd29', 'Gói', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('2c669312-9f9c-4ad2-aec2-f136175de8bc', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP187979', NULL, 'Loperamide 2mg (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('89735252-bb02-40f6-a5cc-6ce907388f08', '2c669312-9f9c-4ad2-aec2-f136175de8bc', 'viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('43c410e8-18d3-427b-87d1-4f6b647bc933', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP187978', NULL, 'Desloratadine (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('f4822437-3ff7-4f3a-80cd-0aeff26842dc', '43c410e8-18d3-427b-87d1-4f6b647bc933', 'Gói', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('86b21c23-c33a-4b51-a0b9-d9083c16a7a9', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP187977', NULL, 'Chlorpheniramine 4mg (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('78663913-bfaa-4b06-afbf-4be20f337159', '86b21c23-c33a-4b51-a0b9-d9083c16a7a9', 'viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('871b04af-b54b-4ae8-b889-72b48f6c7adb', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP187976', NULL, 'Cetirizine (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('37312e4b-2a43-4dc9-8300-7634611e2816', '871b04af-b54b-4ae8-b889-72b48f6c7adb', 'viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('a06249d1-6bdd-47e1-9d78-a622fcbd872f', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP187975', NULL, 'Bromhexin 8 (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('342dea51-6c88-4f35-8945-83e0c55fe713', 'a06249d1-6bdd-47e1-9d78-a622fcbd872f', 'viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d0809d94-aea8-4e95-98bc-553f2be2f82d', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP187974', NULL, 'Alimemazin (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('dc28f246-50fc-4d78-891b-cdf8bc1a450b', 'd0809d94-aea8-4e95-98bc-553f2be2f82d', 'viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('52bcb8e7-8a51-4a61-964d-6bdeaaaec1e2', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP187973', NULL, 'Acetylcystein 200mg (Gói) (Cắt liều)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('0cb29fd4-5b3a-4116-90e6-5be3be6edeb1', '52bcb8e7-8a51-4a61-964d-6bdeaaaec1e2', 'Gói', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('634e6a23-1010-4e2d-864f-687fb7bddd17', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP187968', NULL, 'Aspirin hộp trắng', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('f315a03e-c375-4ab5-9284-0e7254cb3935', '634e6a23-1010-4e2d-864f-687fb7bddd17', 'viên', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, name, is_active, is_direct_sale) 
                        VALUES ('587d666e-caa9-4c8a-a037-56efd647ea06', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'PARENT_HAPACOL', 'Hapacol', true, false);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('bb52b1a8-75cf-4a1f-a25a-a7a026875ed1', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP187965', NULL, 'Hapacol 650 h/100v DHG', true, '587d666e-caa9-4c8a-a037-56efd647ea06', '650 h/100v DHG');
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('d7e59802-5fe9-4538-bd27-a739dafb6b49', 'bb52b1a8-75cf-4a1f-a25a-a7a026875ed1', 'viên', 1, true, 592, 800);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('93e64858-927c-4c07-b4c3-6e005439e12b', '80b8c40b-e414-4042-87ef-8ed5adff3c81', 'SP187964', NULL, 'Bosmovat 10g', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('b0d47793-659e-4e78-9268-6e8f0d00de5f', '93e64858-927c-4c07-b4c3-6e005439e12b', 'Tuýp', 1, true, 15238, 25000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('e98baf72-dae1-44b2-9c9d-892c2d9dbd81', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP187960', NULL, 'Acetylcystein 200mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('8448b1ff-7bc2-44a4-811a-f429bd4580d4', 'e98baf72-dae1-44b2-9c9d-892c2d9dbd81', 'Viên', 1, true, 0, 1000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('61f6640a-95f9-448e-9c3e-a0150c166d5d', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP187957', NULL, 'Ceridon', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('7afab919-7e2d-497d-8ac1-297c9e9b96cc', '61f6640a-95f9-448e-9c3e-a0150c166d5d', 'Viên', 1, true, 0, 1000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('87e6f0d2-78fe-4797-9919-808d22e58c2c', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP187956', NULL, 'Plus C', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('998bfe1a-8c65-4842-a6ca-d608f7eacf50', '87e6f0d2-78fe-4797-9919-808d22e58c2c', 'Tuýp', 1, true, 9500, 40000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('1d9eb70c-9858-4aaa-84ef-30ff89e7cf9b', 'bcdbf0bd-cdd8-4e67-87eb-c654494ef3bb', 'SP187954', NULL, 'Kẹo Chanh Gừng Ô Mai', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('2a9a341a-ffe2-4f1a-9a67-e9581b6d80fc', '1d9eb70c-9858-4aaa-84ef-30ff89e7cf9b', 'Vỉ', 1, true, 9000, 15000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('64f5e68e-1578-4889-ae75-42a9f6788202', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP187946', NULL, 'Bông 10g', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('1456fb69-aa10-4ac5-8879-816461704547', '64f5e68e-1578-4889-ae75-42a9f6788202', 'Gói', 1, true, 3500, 5000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('108699e6-ed71-4896-996a-6c6fc898a916', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP187944', NULL, 'Viên đặt âm đạo Vaginapoly', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('59d4bb0b-5371-4b08-ae6d-0be945661ff5', '108699e6-ed71-4896-996a-6c6fc898a916', 'viên', 1, true, 5669.7, 6500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('bcfe1573-43de-469f-a63c-bb2c9ee351e8', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP187943', NULL, 'Thuốc liều 12k', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('a7be5ea9-ad4b-4580-a53b-fbc701762f4a', 'bcfe1573-43de-469f-a63c-bb2c9ee351e8', 'Viên', 1, true, 0, 12000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('84d1960f-a02c-4f23-9c10-4e5f4a8c7d87', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP187932', NULL, 'Spacmarizine', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('f624c110-66f8-445c-aded-cb018de8b54f', '84d1960f-a02c-4f23-9c10-4e5f4a8c7d87', 'Viên', 1, true, 300, 500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('9b796485-b699-416a-b492-a022b2c1e25b', 'c4ec852b-1bee-40b4-8477-431921cc8073', '8936058820050', '8936058820050', 'Eskar xanh', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('81f0e658-1776-4bec-aa73-3af0373165f4', '9b796485-b699-416a-b492-a022b2c1e25b', 'chai', 1, true, 21000, 25000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d40443ab-00b5-4a9e-beb7-24eaf29238e3', '80b8c40b-e414-4042-87ef-8ed5adff3c81', 'SP187928', NULL, 'Dầu khuynh diệp Family', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('26406aa2-9f65-4fd6-9fb6-d5bbccf1bfa1', 'd40443ab-00b5-4a9e-beb7-24eaf29238e3', 'Chai', 1, true, 37500, 50000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('5b37f464-0c43-489d-83e9-192fab43460f', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP187925', NULL, 'ImoBoston', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('3cced1d3-bbed-4907-946d-3776a5a4845f', '5b37f464-0c43-489d-83e9-192fab43460f', 'Viên', 1, true, 430, 600);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('f0cec852-6f80-458b-ae3a-9ceb6b7e29e3', 'c4ec852b-1bee-40b4-8477-431921cc8073', '8858992502987', '8858992502987', 'Tradolgesic h/100', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('f2bcf4fd-3739-4434-934b-6a0b5d287abf', 'f0cec852-6f80-458b-ae3a-9ceb6b7e29e3', 'Viên', 1, true, 1800, 6000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('dc279e14-82d9-4879-865f-3997efd05b4d', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP187920', NULL, 'Novomycine 3MIU', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('220a3bf5-6fc1-44c6-a24e-d59b8fba2916', 'dc279e14-82d9-4879-865f-3997efd05b4d', 'Viên', 1, true, 4680, 6000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('0933cdfc-4aba-4f95-9734-1219a5fc58c4', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP187911', NULL, 'Urgo cho vết thương bỏng', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('0bae7410-320e-482d-9d91-dfbdd8c8fc0e', '0933cdfc-4aba-4f95-9734-1219a5fc58c4', 'Miếng', 1, true, 22500, 25000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('bec9f50d-c664-47c7-aa6e-5a16eeeaccf6', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP187909', NULL, 'Găng tay Nitrile', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('272e15a0-d258-406c-a765-73561f65bfcc', 'bec9f50d-c664-47c7-aa6e-5a16eeeaccf6', 'Cái', 1, true, 690, 1000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('565cf0bf-920a-44f6-95d3-9d359802b753', '21a20902-7d3b-443c-89ae-9ebc911810ff', 'SP187908', NULL, 'Munderm', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('af2b2e4b-7e49-488b-b98d-0dc286e8e2f8', '565cf0bf-920a-44f6-95d3-9d359802b753', 'Tuýp', 1, true, 200000, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('52872081-a605-43b9-9711-d3b0c5589a40', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP187902', NULL, 'Oracortia', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('d22a96b3-5070-4e66-8111-b42039948e30', '52872081-a605-43b9-9711-d3b0c5589a40', 'Gói', 1, true, 9848.27, 12000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('8aa7cefc-b007-4119-b36c-ec1c1ece85a4', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP187885', NULL, 'Terp-cod', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('fe3b3870-ce80-4a64-9f95-a4f6473efee8', '8aa7cefc-b007-4119-b36c-ec1c1ece85a4', 'Viên', 1, true, 1100, 2000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('f6c77fce-c63f-4d58-8e9c-8526d95ed970', '21a20902-7d3b-443c-89ae-9ebc911810ff', 'SP187882', NULL, 'Acuroff', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('ff6d88e5-27f6-4807-ad5d-a4214cd6ea08', 'f6c77fce-c63f-4d58-8e9c-8526d95ed970', 'viên', 1, true, 3500, 6000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('cdc888ce-f6d4-4599-a5c0-112d54089eee', 'bcdbf0bd-cdd8-4e67-87eb-c654494ef3bb', 'SP187879', NULL, 'Kẹo ngậm ho bách bộ', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('ebb72c3b-e217-432d-b548-d2a01eeac4ad', 'cdc888ce-f6d4-4599-a5c0-112d54089eee', 'Viên', 1, true, 1380, 2600);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('9fc060a9-43dc-4acf-8576-be1a76ad6dca', '21a20902-7d3b-443c-89ae-9ebc911810ff', 'SP187876', NULL, 'Xà bông permethrin', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('bd227c48-c0ac-4280-92b8-94b21e699c8b', '9fc060a9-43dc-4acf-8576-be1a76ad6dca', 'hộp', 1, true, 85000, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('6331cff3-ee6c-4570-826c-2c5cd30cc885', '21a20902-7d3b-443c-89ae-9ebc911810ff', 'SP187875', NULL, 'Tazret 0.1%', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('6d623ea9-3126-4cfd-a602-701fb708ee27', '6331cff3-ee6c-4570-826c-2c5cd30cc885', 'tuýp', 1, true, 170000, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('684e85fa-c43e-495b-9399-72ec500abcf1', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP187872', NULL, 'Dognefin 50mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('1884d6c0-a195-45c7-a208-77e003868b93', '684e85fa-c43e-495b-9399-72ec500abcf1', 'Viên', 1, true, 1000, 1500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('c0051d26-fa77-40f4-9ab7-127b317cf9d8', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP187866', NULL, 'Máy đo huyết áp Wrist electronic', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('c06499b7-0964-4212-9225-a9c1d57f8c26', 'c0051d26-fa77-40f4-9ab7-127b317cf9d8', 'Cái', 1, true, 150000, 300000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('861633e9-fdd0-485d-921a-920d265c4357', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP187865', NULL, 'Berberin', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('9427a511-78a9-4099-af1e-d961081f6e49', '861633e9-fdd0-485d-921a-920d265c4357', 'Hộp', 1, true, 0, 20000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('2779d5f2-1958-4e8b-ba3f-38aa4f7dee16', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP187858', NULL, 'Alanboss', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('eb145f0c-b506-460c-a8bb-5d5afc2bf9b9', '2779d5f2-1958-4e8b-ba3f-38aa4f7dee16', 'Viên', 1, true, 7333, 9000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('b48a3fe0-b4a4-4af3-b2c8-8d4e978135f4', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP187855', NULL, 'IHYBES-H 150', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('bdb46439-7ef5-4105-b442-cb6fd27c321b', 'b48a3fe0-b4a4-4af3-b2c8-8d4e978135f4', 'Viên', 1, true, 1300, 2500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('f35cb0d1-2aba-41b4-aee3-f6fb8b8c30ab', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP187852', NULL, 'IHYBES 150', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('e73375a0-c596-4d8d-bb6e-7052e014c7b8', 'f35cb0d1-2aba-41b4-aee3-f6fb8b8c30ab', 'Viên', 1, true, 1000, 2000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('158e0618-511a-41ab-a9cf-9241f6da693a', '21a20902-7d3b-443c-89ae-9ebc911810ff', 'SP187844', NULL, 'Premiscab lotion', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('2812db43-adb0-4a2b-9a03-677e8b583ffd', '158e0618-511a-41ab-a9cf-9241f6da693a', 'tuýp', 1, true, 85000, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('b139f094-e932-4e17-b55a-866968219bc9', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP187841', NULL, 'Clyodas 300', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('62e5b164-cc29-46d4-a841-b756d7c71186', 'b139f094-e932-4e17-b55a-866968219bc9', 'Viên', 1, true, 2450, 3000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('9d3b51b8-13da-4edd-9396-5dbcbe819f0f', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP187832', NULL, 'Mật Ong Nghê Y Phúc', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('da797a12-0112-41d3-a4b9-460e08a41232', '9d3b51b8-13da-4edd-9396-5dbcbe819f0f', 'Gói', 1, true, 5780, 8000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d3793d49-43e0-4ad1-aa0e-569c462f0443', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP187830', NULL, 'Trà Gừng', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('2298ca01-5cc9-40e9-96cb-9c5a029a00b4', 'd3793d49-43e0-4ad1-aa0e-569c462f0443', 'Gói', 1, true, 1000, 2000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('7ece1a92-eb97-4440-a789-40ec41d0d4d3', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP187827', '8936021810798', 'Cảm Xuyên Hương', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('e5c93567-4b02-4c74-be1f-592e4521d22b', '7ece1a92-eb97-4440-a789-40ec41d0d4d3', 'Viên', 1, true, 500, 1000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('60d94d32-823e-404b-97b6-5a8f91af3006', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP187826', '8934574091312', 'Viên nghệ mekophar', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('caff0f6a-d0f5-41d8-81df-ec9b78fb0a4e', '60d94d32-823e-404b-97b6-5a8f91af3006', 'Lọ', 1, true, 37500, 40000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('8a590f32-5c66-41f7-821f-77efafe335fc', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP187823', NULL, 'Estrolife', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('677697fe-b9a2-45a5-9704-44c064d38502', '8a590f32-5c66-41f7-821f-77efafe335fc', 'Viên', 1, true, 3000, 5000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('933da1ec-fafd-4f2b-b6f0-aa5d6b4164a2', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP187822', '8936224540102', 'Sano D3K2', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('94122982-3dd8-4d0b-9861-71ebc3c95700', '933da1ec-fafd-4f2b-b6f0-aa5d6b4164a2', 'Lọ', 1, true, 110000, 150000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d477a4d3-8fc7-40a9-a43e-46062b078e92', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP187821', '8938538811763', 'Sâm Nhung Bổ Thận', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('969b2f1c-5d56-4da5-9b98-4b79e969c2a1', 'd477a4d3-8fc7-40a9-a43e-46062b078e92', 'Lọ', 1, true, 53703, 120000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('ef979d87-4430-42cd-ae25-817f399257fb', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', '8938538811534', '8938538811534', 'Zin C', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('6ce30491-3549-4c7f-861f-322e201316e4', 'ef979d87-4430-42cd-ae25-817f399257fb', 'Viên', 1, true, 370, 700);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('f274de4a-1fe3-4fb3-90e6-5fd0b58f656d', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP187820', NULL, 'Bcs Sarazu', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('ff659d4e-29ff-41f1-bd23-0ae5f567c1a2', 'f274de4a-1fe3-4fb3-90e6-5fd0b58f656d', 'Cái', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('42816c68-72f9-4ec1-95bc-d2b48bd6fb87', '21a20902-7d3b-443c-89ae-9ebc911810ff', 'SP084843', NULL, 'Tazret 0.05%', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('a2362ad2-5aec-4bb4-b536-48a8a9edd235', '42816c68-72f9-4ec1-95bc-d2b48bd6fb87', 'Tuýp', 1, true, 170000, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('70531483-c8b2-46ed-9f5f-e6fb39900692', '80b8c40b-e414-4042-87ef-8ed5adff3c81', 'SP084842', '936064218452', 'Dầu Thất Sơn Trắng', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('0496be2a-1c11-46b9-b68b-0be3b4c46587', '70531483-c8b2-46ed-9f5f-e6fb39900692', 'Chai', 1, true, 26600, 30000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('fd138bcb-0d9f-4a23-ac79-29e21320348f', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP084838', '8936139773282', 'Sữa Ngũ Cốc', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('bb9b910b-05ae-4b2d-8ad1-45b42cdd6d23', 'fd138bcb-0d9f-4a23-ac79-29e21320348f', 'Lon', 1, true, 400000, 500000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('8a653cb6-8296-4cd9-9ed3-7dc262695d27', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP084827', '8938530637125', 'Thiên môn bổ phổi thủy mẫu', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('d9430b22-baef-4c0b-beb9-ba1dfd048010', '8a653cb6-8296-4cd9-9ed3-7dc262695d27', 'Chai', 1, true, 63500, 76000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('1759d73c-296c-421b-9e76-dcba04cef897', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP084816', '8938554087982', 'Men Vi Sinh ProB', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('19fed3d9-9a41-4d6b-84d4-e822b4512c12', '1759d73c-296c-421b-9e76-dcba04cef897', 'Ống', 1, true, 4000, 6000);
INSERT INTO public.products (id, category_id, product_code, name, is_active, is_direct_sale) 
                        VALUES ('f83ad115-c367-46d1-b6e3-bce4b948ce2f', 'bcdbf0bd-cdd8-4e67-87eb-c654494ef3bb', 'PARENT_STREPSILS', 'Strepsils', true, false);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('cde3dfb6-d131-46b3-92bf-20f22d6bca21', 'bcdbf0bd-cdd8-4e67-87eb-c654494ef3bb', '9556108211332', NULL, 'Strepsils Honey And Lemon', true, 'f83ad115-c367-46d1-b6e3-bce4b948ce2f', 'Honey And Lemon');
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('41177404-bab6-45b2-a865-57a1ad5ded89', 'cde3dfb6-d131-46b3-92bf-20f22d6bca21', 'Viên', 1, true, 1400, 1700);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('b8e7daae-a4c6-4146-b0fe-8eea8abaad9e', '80b8c40b-e414-4042-87ef-8ed5adff3c81', 'SP084814', '8888951888784', 'Dầu Gió xanh Eagle ( Chai Nhỏ )', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('84e45f2d-90c7-4fb5-bd57-d9f3e1544592', 'b8e7daae-a4c6-4146-b0fe-8eea8abaad9e', 'Chai', 1, true, 42500, 50000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('bb845484-7f08-4061-8534-e1bc98484765', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP084809', '8938535625417', 'Skiperfect', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('ec9b72be-965b-494a-ab05-1c8c688d0d2f', 'bb845484-7f08-4061-8534-e1bc98484765', 'Viên', 1, true, 1685, 4000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('88f62e25-5d9d-411c-a971-dff860c809f4', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', '8936206260035', '8936206260035', 'Viên Sủi Vitrum', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('8474d4e4-0cdc-4f27-af98-bfff786abcdb', '88f62e25-5d9d-411c-a971-dff860c809f4', 'Viên', 1, true, 3500, 6000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('a04cbaf4-561a-42c3-9f28-93f382d603fe', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP084807', '8936193782268', 'Pooh kids- Ăn Ngon Ngủ Ngon', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('c98271ba-c4f9-4616-84fc-ff7fece2bf53', 'a04cbaf4-561a-42c3-9f28-93f382d603fe', 'Ống', 1, true, 5950, 7500);
INSERT INTO public.products (id, category_id, product_code, name, is_active, is_direct_sale) 
                        VALUES ('f3626e87-aa48-4356-bb99-aeb36029ed3c', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'PARENT_PANADOL', 'Panadol', true, false);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('69a307be-28d3-4cf0-abb5-102aac877afa', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP084804', NULL, 'Panadol viên sủi', true, 'f3626e87-aa48-4356-bb99-aeb36029ed3c', 'viên sủi');
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('d7382b93-3543-4fed-9cbf-1529b54f9a93', '69a307be-28d3-4cf0-abb5-102aac877afa', 'viên', 1, true, 2875, 4000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('b95fd33e-5449-4ba7-8473-5bfc39eff831', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001924', NULL, 'Chích Thuốc Cảm', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('404220c9-eba4-4d42-80f8-81b4efbe14e3', 'b95fd33e-5449-4ba7-8473-5bfc39eff831', 'Mũi', 1, true, 20667.4, 100000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('24ed1931-95c0-42ec-ae0e-1207fa1246e1', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001923', NULL, 'Soli Medon 40', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('7dec28b2-efff-42ee-bc92-9ad78cbaf217', '24ed1931-95c0-42ec-ae0e-1207fa1246e1', 'Hộp', 1, true, 20000, 40000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('41555498-f606-4ff5-ac29-e64b49f8e023', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001920', NULL, 'Moriamin Forte', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('99173672-9edb-4d87-b515-5636b39b1330', '41555498-f606-4ff5-ac29-e64b49f8e023', 'Viên', 1, true, 3050, 3500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('0a073733-d48d-42a7-81c4-a3780b0365eb', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001917', NULL, 'Orlistat RVN 120', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('6bbd62a1-81f9-472e-9782-b46c1656a686', '0a073733-d48d-42a7-81c4-a3780b0365eb', 'viên', 1, true, 5600, 8500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('779c4655-2838-402f-baa1-8cd37af23ab5', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP001914', NULL, 'Men vi sinh bioxclausi hataphar. hộp 20 ống x 5ml.', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('d3b8041a-0fbc-4e9a-9425-294659ad48af', '779c4655-2838-402f-baa1-8cd37af23ab5', 'Ống', 1, true, 0, 6000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('fb880f78-260e-4c27-8ca6-82824112eaeb', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP001912', NULL, 'Khẩu trang 3 mask', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('92772f32-d4b9-4150-ad1d-6b756e3b96d6', 'fb880f78-260e-4c27-8ca6-82824112eaeb', 'Gói', 1, true, 7000, 10000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('1992f7d7-030a-4ee2-b287-514c9c81e7d9', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001909', NULL, 'Zabales 75mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('6c0fc858-a906-42d4-8dae-fe48ad34066d', '1992f7d7-030a-4ee2-b287-514c9c81e7d9', 'Viên', 1, true, 1160, 2000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('a471d67f-7e7f-4341-a590-b67648b6dc08', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP001905', NULL, 'Gan Cà Gai Leo 100k', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('b5a271db-d0a8-4576-a28b-51aab933f28b', 'a471d67f-7e7f-4341-a590-b67648b6dc08', 'Viên', 1, true, 1200, 2000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('9ebfccc3-fb94-46e8-86dc-9e7039ef3601', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001900', '8936014583548', 'Tatanol Children', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('c2b0128a-7ce7-4a42-9cb4-8372689272c5', '9ebfccc3-fb94-46e8-86dc-9e7039ef3601', 'Viên', 1, true, 329, 500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('a5d34e7d-409b-4245-a9e1-d0ce1a462b95', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001895', NULL, 'Kaflovo 500mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('580eaff3-3ed2-47e2-8fed-b6c1ef13c326', 'a5d34e7d-409b-4245-a9e1-d0ce1a462b95', 'Viên', 1, true, 1542, 3000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('56dfe458-3c82-42d6-8e10-b8706b03ef05', '80b8c40b-e414-4042-87ef-8ed5adff3c81', 'SP001888', NULL, 'Dầu Lăn Xoa Bóp', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('b2e16d34-410c-40d2-9931-03d181041948', '56dfe458-3c82-42d6-8e10-b8706b03ef05', 'chai', 1, true, 80000, 100000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('0d7312f5-6f62-4ab1-9584-08c84012e540', '21a20902-7d3b-443c-89ae-9ebc911810ff', 'SP001886', NULL, 'Deriva MS 0.1', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('902f9670-5a6d-40dc-8c40-b7928dc54d3b', '0d7312f5-6f62-4ab1-9584-08c84012e540', 'Tuýp', 1, true, 140000, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('165adaf1-50d6-4f4c-9dfa-ac3df8596f7a', '21a20902-7d3b-443c-89ae-9ebc911810ff', 'SP001884', NULL, 'Aldocont C', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('c2601703-8603-427c-8397-f972ab087505', '165adaf1-50d6-4f4c-9dfa-ac3df8596f7a', 'Tuýp', 1, true, 65000, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('43906e02-663e-4a89-add8-82a5c87c2ef3', '21a20902-7d3b-443c-89ae-9ebc911810ff', 'SP001883', NULL, 'Melacare Acne', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('4ded11ca-9142-495f-983f-95f0f61de468', '43906e02-663e-4a89-add8-82a5c87c2ef3', 'Tuýp', 1, true, 0, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('eb9b85ad-546f-437d-9a7d-7855476c97ea', '21a20902-7d3b-443c-89ae-9ebc911810ff', 'SP001882', NULL, 'Deriva CMS', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('d821161c-cd38-4c71-b6c2-1828c3c4ad75', 'eb9b85ad-546f-437d-9a7d-7855476c97ea', 'Tuýp', 1, true, 160000, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('9355a2b6-d8ea-4a8e-861c-2931015c1184', '21a20902-7d3b-443c-89ae-9ebc911810ff', 'SP001881', NULL, 'Deriva Bpo', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('48d3322c-4063-4e0c-8d7f-c5f9129fd889', '9355a2b6-d8ea-4a8e-861c-2931015c1184', 'Tuýp', 1, true, 170000, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d4eb2787-ece4-49df-854c-3700b61d4376', '21a20902-7d3b-443c-89ae-9ebc911810ff', 'SP001880', NULL, 'Erythego', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('3db91d9c-17c1-44fe-8972-6bd9daa07bd0', 'd4eb2787-ece4-49df-854c-3700b61d4376', 'tuýp', 1, true, 140000, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('6d27e243-18ad-49b5-86ff-a3d3d9020951', '80b8c40b-e414-4042-87ef-8ed5adff3c81', 'SP001868', NULL, 'Bostoral', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('25411f92-092a-4577-86fd-9798981170f8', '6d27e243-18ad-49b5-86ff-a3d3d9020951', 'Tuýp', 1, true, 18000, 25000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('cf9b81c5-ed5f-4818-8b6b-83bb5b85d725', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001861', '8936064214195', 'Olangim 10mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('825e9400-8c64-407a-a9e3-1ea9e7787126', 'cf9b81c5-ed5f-4818-8b6b-83bb5b85d725', 'Viên', 1, true, 700, 1000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('4b72f75a-e284-4896-a90c-644b499b371a', '21a20902-7d3b-443c-89ae-9ebc911810ff', '8938531751257', '8938531751257', 'Skinamex 100g', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('b9d74376-082d-4209-b75c-df481aaa78e9', '4b72f75a-e284-4896-a90c-644b499b371a', 'Chai', 1, true, 0, 150000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('ee3d4a2a-5786-43d0-bb71-c0ce528e1148', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP001859', NULL, 'Nước muối Chai lớn', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('0ca1ef69-11e8-478b-a490-66b87660a72d', 'ee3d4a2a-5786-43d0-bb71-c0ce528e1148', 'Chai', 1, true, 10000, 15000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('bf167dd0-a7bb-4da2-8123-ac8592b4df70', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP001858', NULL, 'Nước muối chai nhỏ', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('cd86baf3-f0ad-4814-82d6-65a0153417de', 'bf167dd0-a7bb-4da2-8123-ac8592b4df70', 'Chai', 1, true, 6700, 10000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('dc39371f-3afd-420a-ae44-20eafa8ba24e', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001856', '8934690101438', 'Biragan 300', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('2fddfde2-afe6-48ba-958e-ff1bd149d179', 'dc39371f-3afd-420a-ae44-20eafa8ba24e', 'Viên', 1, true, 2000, 3000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('ec8c8ca4-e641-49c0-9220-863ba662a0da', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001854', '8934690101292', 'Biragan 150', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('ec23e447-ac54-4e23-be4e-f50f13774d26', 'ec8c8ca4-e641-49c0-9220-863ba662a0da', 'Viên', 1, true, 2300, 2600);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('dd5be500-7e2d-4f38-a724-8708517be2df', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001851', '8936098965094', 'Zensalbu nebules 5.0', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('542d9c3a-0678-4869-a086-c8790dd7a926', 'dd5be500-7e2d-4f38-a724-8708517be2df', 'Ống', 1, true, 7000, 9000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('f33e59d1-428a-4321-9a7b-42390c69ce20', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001846', '8936061373161', 'Mibeserc 24', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('448b7fa6-1f53-4101-83d1-245531ecbd40', 'f33e59d1-428a-4321-9a7b-42390c69ce20', 'Viên', 1, true, 2000, 4000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('e7907228-7e4e-46e9-b4c1-752a49b3cf80', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001844', '8935206094916', 'Hapacol 250', true, '587d666e-caa9-4c8a-a037-56efd647ea06', '250');
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('95964eb5-44aa-4d15-8f0e-2a56d5698ab3', 'e7907228-7e4e-46e9-b4c1-752a49b3cf80', 'Gói', 1, true, 1920, 2500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('0077660b-3b83-4b93-beec-9ec9c9b63add', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001837', NULL, 'Gabapentin 300', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('8bacd88f-7cf7-42f9-ac17-ea612eef2900', '0077660b-3b83-4b93-beec-9ec9c9b63add', 'Viên', 1, true, 850, 1500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('555db8a2-9fba-4318-9b9b-ab8676274d56', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001834', '8002660025371', 'Betaserc 24mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('239859f5-7d02-47b4-b20e-20cadc9ea0e4', '555db8a2-9fba-4318-9b9b-ab8676274d56', 'Viên', 1, true, 6500, 7000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('1b94108e-c9ca-407b-9c68-ab9f38b006fa', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001824', '8935146200415', 'Cefuroxim 500mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('81c0b127-75c1-48e0-a15e-6efa9bf0380b', '1b94108e-c9ca-407b-9c68-ab9f38b006fa', 'Viên', 1, true, 3050, 4000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('501bf813-458c-4835-9c1f-34cc3c1b6748', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001822', '8934690001042', 'Bifacold 200mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('e3b8e5c9-dfa6-4d88-afd0-e25bd59e85fe', '501bf813-458c-4835-9c1f-34cc3c1b6748', 'Gói', 1, true, 1300, 2000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('f8afea24-a5cf-467d-abc3-f90a23d11e6d', '21a20902-7d3b-443c-89ae-9ebc911810ff', 'SP001820', NULL, 'Dầu Gội Sano Hair', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('fe7a93f7-1952-4924-aa96-212612dfa159', 'f8afea24-a5cf-467d-abc3-f90a23d11e6d', 'Gói', 1, true, 4500, 6000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('82dfa614-bd24-4813-85bb-5c47c14a1171', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP001818', NULL, 'Khẩu Trang', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('02df2ddd-06d9-48fb-9f0c-76ea9bc4c1e8', '82dfa614-bd24-4813-85bb-5c47c14a1171', 'Gói', 1, true, 5000, 10000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('0253842e-7b7e-4e02-88a5-df637c621e36', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP001816', NULL, 'Calci Nano plus', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('67f76600-ec91-4e7e-9177-925410d552e3', '0253842e-7b7e-4e02-88a5-df637c621e36', 'Ống', 1, true, 5500, 7500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('fe353561-86c6-46a0-9aea-5ef689593fa7', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP001815', NULL, 'Khẩu trang Famapro', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('41ff9b51-0204-4f19-8a2f-bdddf73a2677', 'fe353561-86c6-46a0-9aea-5ef689593fa7', 'Hộp', 1, true, 8000, 10000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('48a52d96-606d-4cae-877e-3599d6b704e0', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001812', '8935206094992', 'Hapacol 150', true, '587d666e-caa9-4c8a-a037-56efd647ea06', '150');
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('eeb881c1-72a6-4434-8934-df79c8602f20', '48a52d96-606d-4cae-877e-3599d6b704e0', 'Gói', 1, true, 1675, 2000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('61b633e5-a621-4cc5-84dd-dde0d5a17811', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001809', NULL, 'Panactol Enfant', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('ff089ce0-f7bb-4828-94a0-9a14bf4ded1a', '61b633e5-a621-4cc5-84dd-dde0d5a17811', 'Viên', 1, true, 350, 500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('5cd30ddf-2cbc-4b7c-acdb-a040a83876b7', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP001805', NULL, 'Gan 10k vỉ', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('7d6f7734-d3c7-404a-b0bc-57f778894d97', '5cd30ddf-2cbc-4b7c-acdb-a040a83876b7', 'Viên', 1, true, 960, 1000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('fe5038d1-e747-49c5-ae0a-f73ee3508fcd', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', '8935127577772', '8935127577772', 'Tobicom', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('02496dc3-a008-4fdf-b36c-97b365562ce7', 'fe5038d1-e747-49c5-ae0a-f73ee3508fcd', 'Viên', 1, true, 1600, 2000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('7b9a4478-fa4d-4be7-a7e2-e62f41de3f78', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP001792', NULL, 'Cồn 90 (chai nhỏ)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('0bef7d2f-e8b5-4632-9df2-5aada35f6fc8', '7b9a4478-fa4d-4be7-a7e2-e62f41de3f78', 'Chai', 1, true, 3540, 5000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('da7202fb-dd0f-47d6-93fd-ede6fdfda554', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP001791', NULL, 'Cồn 90 (chai lớn)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('eff8624b-1b08-436f-a215-799c530eefcc', 'da7202fb-dd0f-47d6-93fd-ede6fdfda554', 'Chai', 1, true, 42000, 50000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('8408a5e3-525d-4337-ade3-f2bb290a056e', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP001790', NULL, 'Cồn 90 (Chai Lớn Vòi )', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('19087777-aa97-428c-a5c2-3952d2add51e', '8408a5e3-525d-4337-ade3-f2bb290a056e', 'Chai', 1, true, 48000, 60000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('93072124-a3da-4f59-bd15-529b9be41d8e', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP001789', NULL, 'Cồn 70 (Chai Lớn )', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('418f56fa-589b-4434-a0cf-064e14cc6349', '93072124-a3da-4f59-bd15-529b9be41d8e', 'Chai', 1, true, 42400, 50000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('5302900c-b6f4-450e-a25e-bee9dd1ab927', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP001784', NULL, 'Kẹo dẻo 10k', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('f3499681-1a5b-42d3-9366-06e0a344e176', '5302900c-b6f4-450e-a25e-bee9dd1ab927', 'Gói', 1, true, 6940, 10000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d436626e-a32e-46c5-88e1-af0037bacda2', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001780', '8934903000992', 'Desloratadin 2.5mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('0828e732-9d61-4934-a654-fb9977f0c2dc', 'd436626e-a32e-46c5-88e1-af0037bacda2', 'Gói', 1, true, 4800, 6000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('9b5a0cad-eee1-46a3-882f-023036f6bbf2', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001775', '8935146200347', 'Augxicine 1g', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('25de796b-d095-4163-8f3a-16f34cffc753', '9b5a0cad-eee1-46a3-882f-023036f6bbf2', 'Viên', 1, true, 3180, 8000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('df78ae33-ce42-400b-b21d-b1d545b2b32e', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001770', '8935146200279', 'Augxicine 625', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('687eca4f-4f87-4af0-baeb-7b268e9816aa', 'df78ae33-ce42-400b-b21d-b1d545b2b32e', 'Viên', 1, true, 2800, 6000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('c078673b-ba1b-4584-a80a-d401cf11d735', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001769', NULL, 'Chích viêm mũi dị ứng', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('11e72612-8ec0-4bd4-b001-763a7f1a64c4', 'c078673b-ba1b-4584-a80a-d401cf11d735', 'Viên', 1, true, 69231.4, 170000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('ec1e0e1a-388f-4b4b-8f22-4fc2919c6fe0', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP001766', NULL, 'Creatin boston', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('71021320-9caf-44d2-a72f-48a4957d41ad', 'ec1e0e1a-388f-4b4b-8f22-4fc2919c6fe0', 'Viên', 1, true, 890, 1000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('887a10fc-4161-4797-9240-d04a20753b0e', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP001763', NULL, 'Homiginmin Ginseng', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('cc98693a-c741-4631-b506-e791240fc617', '887a10fc-4161-4797-9240-d04a20753b0e', 'Viên', 1, true, 600, 2000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('15d4591d-1ea6-4603-9276-326d91fddbfd', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001751', NULL, 'AT Bisoprolol 2.5mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('debfd6bf-e1a9-4607-b17f-154d17d25bc4', '15d4591d-1ea6-4603-9276-326d91fddbfd', 'Viên', 1, true, 300, 1000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('ad794b8a-b191-411f-866d-d606aa27e443', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001748', NULL, 'Ho Xanh', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('3d7215c3-2f02-4101-ac84-868fec35a6f6', 'ad794b8a-b191-411f-866d-d606aa27e443', 'Viên', 1, true, 350, 500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('4f005fdd-d3ef-43b0-b90e-7fa1dd47eede', '21a20902-7d3b-443c-89ae-9ebc911810ff', 'SP001738', NULL, 'Soffell', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('9756396d-6252-41af-a19a-cdb18f34621b', '4f005fdd-d3ef-43b0-b90e-7fa1dd47eede', 'Chai', 1, true, 20000, 22000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('7d464273-b267-41b2-a8e9-1ae3400724da', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001732', '8936024391874', 'Spinolac 25mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('b4f4bb4e-ee21-4f02-a67b-bbc0b9184665', '7d464273-b267-41b2-a8e9-1ae3400724da', 'Viên', 1, true, 1853, 2000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('cfd010f6-acd2-4ed6-b056-8290bc7cbb75', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001727', '8936064214959', 'ASPIRIN 81mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('36ce3c07-10fa-4d13-b223-395e6cc0cdeb', 'cfd010f6-acd2-4ed6-b056-8290bc7cbb75', 'Viên', 1, true, 190, 500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('a2aec0fa-bf82-4ab2-89d6-b6f7f5d3426e', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP001724', NULL, 'Sắt Viên', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('eb5fbaef-ad03-4676-a5ee-a341b5fec9c7', 'a2aec0fa-bf82-4ab2-89d6-b6f7f5d3426e', 'Viên', 1, true, 500, 2000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('c9fed49e-95b4-4443-bd31-867e29e40882', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP001708', NULL, 'Vitamin AD', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('20f2b0c0-27ed-4991-b1aa-050852238a94', 'c9fed49e-95b4-4443-bd31-867e29e40882', 'Viên', 1, true, 290, 500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('ec4540d5-5997-49df-9974-291eb3a9d3b0', 'bcdbf0bd-cdd8-4e67-87eb-c654494ef3bb', 'SP001695', NULL, 'Kẹo Ngậm Bảo Thanh', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('51f35b7d-015e-421b-996e-2e93f83d0a77', 'ec4540d5-5997-49df-9974-291eb3a9d3b0', 'Gói', 1, true, 14000, 15000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d2fcecdc-683c-4358-9a5f-c65e6ac775c7', 'bcdbf0bd-cdd8-4e67-87eb-c654494ef3bb', 'SP001693', NULL, 'Kẹo Gừng', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('02965852-3373-4373-b4f8-358d3e8029ea', 'd2fcecdc-683c-4358-9a5f-c65e6ac775c7', 'Viên', 1, true, 400, 1000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('2dd974b9-566e-417b-9dda-6911f5e6be8b', 'bcdbf0bd-cdd8-4e67-87eb-c654494ef3bb', 'SP001691', NULL, 'Kẹo Bạc Hà', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('2f5ad06d-4ea0-4cc3-9293-5c27853d906b', '2dd974b9-566e-417b-9dda-6911f5e6be8b', 'Viên', 1, true, 400, 1000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('9caaf1cd-ad14-4759-bdd6-7bf63676d26d', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP001679', NULL, 'Siro Tỳ Bà Diệp', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('2ac57a67-2077-426f-afbd-97e639cb3c8a', '9caaf1cd-ad14-4759-bdd6-7bf63676d26d', 'Gói', 1, true, 1900, 3000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('22f085ad-1edf-43ef-afe1-19bdaa85a156', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP001677', NULL, 'Thuốc liều 10k', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('654e85d9-2da9-4882-b05d-0b688223ada1', '22f085ad-1edf-43ef-afe1-19bdaa85a156', 'Viên', 1, true, 6000, 10000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('cc0fa286-d2e0-449b-b0ce-a1b5da7b02e0', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP001674', NULL, 'Thử đường', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('b64b9e4f-b8ae-45ac-a765-a212036a67d3', 'cc0fa286-d2e0-449b-b0ce-a1b5da7b02e0', 'Viên', 1, true, 5000, 20000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('fc061104-e340-4544-8312-4393d3cc8a89', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP001672', NULL, 'Que thử đường', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('37de2e1f-672b-45a3-a0d5-59c91f69890f', 'fc061104-e340-4544-8312-4393d3cc8a89', 'que', 1, true, 5000, 9000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('3dc175fb-3590-46c2-9d49-2466ca4bd9bc', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP001669', NULL, 'Găng Tay Y Tế Vglove', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('9558cadb-d8fe-49a8-ae8d-6421a463c516', '3dc175fb-3590-46c2-9d49-2466ca4bd9bc', 'cái', 1, true, 600, 1000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('be3e6ea7-ff4a-40d1-989c-dd2762d6d6a4', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001667', NULL, 'Triamcinolone 80 mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('3d5d81c9-ec5c-419a-978b-34136b8eb49f', 'be3e6ea7-ff4a-40d1-989c-dd2762d6d6a4', 'Ống', 1, true, 68564, 80000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('430d68d3-9171-4a39-8127-8724906395d9', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP001657', '8938538811787', 'Hà Thủ Ô', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('870cce9d-82aa-4f35-8bb7-46ac9d13d378', '430d68d3-9171-4a39-8127-8724906395d9', 'Viên', 1, true, 3000, 5000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('6d443104-3301-4be2-b03a-46c0074b91df', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001656', NULL, 'Chích co thắt đường ruột', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('83739e3c-cecc-43e5-9367-3c8d217b8af6', '6d443104-3301-4be2-b03a-46c0074b91df', 'Viên', 1, true, 2487.4, 50000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('87ae36c0-ae39-4104-855d-afdbd6e03250', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001654', NULL, 'Metoclopramid 10mg( Tiêm )', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('f6564f6e-adce-4a86-b63b-b2b359832404', '87ae36c0-ae39-4104-855d-afdbd6e03250', 'ống', 1, true, 1820, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('aaa799f4-4f68-4d3d-8b2b-adb84768a580', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001653', NULL, 'Chích chóng mặt Diphenhydramin', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('e02900df-5ff6-4758-af6b-44515b834cff', 'aaa799f4-4f68-4d3d-8b2b-adb84768a580', 'Viên', 1, true, 1366.4, 50000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('323c12eb-e9b3-4768-9278-4fc4dc9f0200', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001651', NULL, 'Diphenhydramin 10mg (Tiêm )', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('37ceaca3-15d9-495e-854b-c49f2d23188d', '323c12eb-e9b3-4768-9278-4fc4dc9f0200', 'ống', 1, true, 699, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('2cbf48ff-6b67-488f-9236-883e42e1e771', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001650', NULL, 'Chích cảm Hydrocortisone', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('64f4e2e9-abaa-4c46-9d0c-12ab5c17e0f3', '2cbf48ff-6b67-488f-9236-883e42e1e771', 'Viên', 1, true, 20667.4, 100000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d2ee3cf0-e042-4bbf-a042-a276e16e1703', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001649', NULL, 'Hydrocortisone 100mg(Tiêm)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('45822baf-c728-4029-b1b5-d4f8bcbea4df', 'd2ee3cf0-e042-4bbf-a042-a276e16e1703', 'Ống', 1, true, 20000, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('ba434476-89f4-41ae-a036-53bd6d6fd1c4', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001646', NULL, 'Chích đau nhứt diclofenac 75mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('acef6507-3ba0-4b60-9d44-ef88b3210ed7', 'ba434476-89f4-41ae-a036-53bd6d6fd1c4', 'Viên', 1, true, 2963.4, 50000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('34762300-5747-4f18-a405-104420167f47', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001644', NULL, 'Diclofenac 75mg (Tiêm)', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('5e0ec388-36a1-4af2-b431-05cae7d92419', '34762300-5747-4f18-a405-104420167f47', 'Ống', 1, true, 2296, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('17a9d355-2574-45dd-91f1-86adc1331b6c', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001643', NULL, 'Chích thuốc khoẻ', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('5ad00b54-8905-4e7b-abe2-b8311f0892e4', '17a9d355-2574-45dd-91f1-86adc1331b6c', 'Viên', 1, true, 2392.4, 80000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('a9c12fe5-0d26-4998-bb8e-649a0af4ccb1', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001641', '8936213363026', 'Supvizyn New', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('26de9904-70e7-41ae-a36e-02b5149c0a67', 'a9c12fe5-0d26-4998-bb8e-649a0af4ccb1', 'ống', 1, true, 1725, 0);
INSERT INTO public.products (id, category_id, product_code, name, is_active, is_direct_sale) 
                        VALUES ('d2e01ad1-f7d8-4bb4-bc95-989b4e671dce', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'PARENT_DECOLGEN', 'Decolgen', true, false);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('8184b375-5af0-4829-b0b2-7889bb54a0cf', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001639', '8936022471905', 'Decolgen Forte', true, 'd2e01ad1-f7d8-4bb4-bc95-989b4e671dce', 'Forte');
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('091241cb-6c7e-4191-9a69-325529ffa6fe', '8184b375-5af0-4829-b0b2-7889bb54a0cf', 'Viên', 1, true, 1195, 1500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('6a5e4451-ffca-4c91-9f84-fedddeeda97d', '80b8c40b-e414-4042-87ef-8ed5adff3c81', 'SP001633', '8888951888722', 'Dầu Gió xanh Eagle Brand ( Chai Lớn )', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('0d03feca-442c-4cce-a55d-58e4275528a6', '6a5e4451-ffca-4c91-9f84-fedddeeda97d', 'chai', 1, true, 74180, 80000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('fb83b932-bf61-447e-a616-2eb176e32ffa', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001630', NULL, 'Rotundin 60mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('b6fa9efa-2df2-4845-8d3a-0f3f48e41983', 'fb83b932-bf61-447e-a616-2eb176e32ffa', 'Viên', 1, true, 1037, 1500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('0cf7b72d-18b1-49f1-93c6-97614397c84a', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001625', NULL, 'Periboston', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('47a50485-1bca-4fd8-9a45-9c80037d2842', '0cf7b72d-18b1-49f1-93c6-97614397c84a', 'Viên', 1, true, 535, 800);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('255bb58d-6aed-4cc5-8920-fc7c268c3d20', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001622', '8934618264665', 'Dorocron - MR 30mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('b467eb49-9b1d-4e23-aab6-19033ea5cc4e', '255bb58d-6aed-4cc5-8920-fc7c268c3d20', 'Viên', 1, true, 1150, 1250);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('66d9f32e-99b0-4fcf-9718-68e4d923e8b1', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001619', NULL, 'Diamicron MR 30mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('0e6aa730-014b-42a8-8223-d921d1cb6ddb', '66d9f32e-99b0-4fcf-9718-68e4d923e8b1', 'Viên', 1, true, 3600, 3800);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('aa5e82e2-6357-4bbd-b45a-99f27aa1fd55', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001616', NULL, 'Glucophage 500mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('74132390-7d37-4413-8e52-09fa478cd377', 'aa5e82e2-6357-4bbd-b45a-99f27aa1fd55', 'Viên', 1, true, 1740, 1900);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('cb73ee00-9b79-475c-96f4-7993261eb3e3', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001613', NULL, 'Glucophage 850 mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('5bc55edd-cdc4-4236-a06e-4f44830a4bc6', 'cb73ee00-9b79-475c-96f4-7993261eb3e3', 'Viên', 1, true, 3400, 3500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d37a1e1c-dd8d-4713-a836-ce4675dff1ff', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001610', '8936024391423', 'Comiaryl 2mg/500mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('07c9905c-4865-48d2-9b37-384da810265f', 'd37a1e1c-dd8d-4713-a836-ce4675dff1ff', 'Viên', 1, true, 3000, 3100);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('505410a1-a8c6-4736-9d5d-fcde6912d361', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001607', '8936106320167', 'Glimepiride 4 mg sella', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('c9c62955-e066-4f82-bdde-3e17eb67a25e', '505410a1-a8c6-4736-9d5d-fcde6912d361', 'Viên', 1, true, 1133, 2000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('c80c4aa0-39b6-4bf9-a816-b8bc650d3fd8', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001604', '8934618322792', 'Glucofine 500mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('3972f3df-64b4-40db-b4f5-bde0b1602514', 'c80c4aa0-39b6-4bf9-a816-b8bc650d3fd8', 'Viên', 1, true, 788, 900);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('03350674-dd1f-486d-934a-1794f11c3cd5', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001601', '8936024390150', 'Hasanbest 500/2.5', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('b925cfc9-0a77-4283-a375-43d48c54b6a6', '03350674-dd1f-486d-934a-1794f11c3cd5', 'Viên', 1, true, 1400, 1600);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('b35a0827-df55-4eaa-9434-1eb97fd75f13', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001598', '8936024391119', 'Hasanbest 500/5', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('c57a9761-1c12-47ce-b9a2-257500c97d21', 'b35a0827-df55-4eaa-9434-1eb97fd75f13', 'Viên', 1, true, 1550, 1666);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('2155068c-aec3-4dc5-ac6e-301457ec8a69', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001595', '8934690011096', 'Mefomid 850mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('0bacda2b-a4b3-4f17-9255-07e3a0ed9aab', '2155068c-aec3-4dc5-ac6e-301457ec8a69', 'Viên', 1, true, 900, 1500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('a7cf4b70-73ef-499e-b75b-c1189c9e2e2d', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001592', '8935076033022', 'Metformin 850mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('c41cc5b9-7416-40f8-9007-2890d676621e', 'a7cf4b70-73ef-499e-b75b-c1189c9e2e2d', 'Viên', 1, true, 650, 1000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('13fcf60f-5ecb-48ce-b762-fef63eb8fc05', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001589', '8934690110195', 'Mefomid 500mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('a96a3fa6-9412-4847-83d8-4e61eeaf46fc', '13fcf60f-5ecb-48ce-b762-fef63eb8fc05', 'Viên', 1, true, 500, 700);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('2b82552f-ed69-44ac-8129-bcc4527f0408', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001586', '4013054014523', 'Berlthyrox 100mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('cffa6267-83ce-4050-807a-b7886b0fe9c8', '2b82552f-ed69-44ac-8129-bcc4527f0408', 'Viên', 1, true, 724, 800);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('fa31818c-36ee-4d10-ac77-1ebc009da3c9', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001583', '8935022708097', 'Disthyrox 100mcg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('f4005dd3-7bce-4922-b779-24d71b89d3f4', 'fa31818c-36ee-4d10-ac77-1ebc009da3c9', 'Viên', 1, true, 312, 1000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('3ed0662c-a8d0-40b6-9ec1-a6fbb1023893', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001579', NULL, 'Mebecar Chewtab', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('2e338199-8df3-4bb6-930b-8c4db13b8b33', '3ed0662c-a8d0-40b6-9ec1-a6fbb1023893', 'Viên', 1, true, 8900, 15000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('eb5c0b02-5b45-4df7-b09f-23aab5877fe4', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001576', '8936106320976', 'Lostad T25', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('c555752e-f1ac-4011-9a4a-a2260163f530', 'eb5c0b02-5b45-4df7-b09f-23aab5877fe4', 'Viên', 1, true, 1400, 1600);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('ee6b02f3-dcfd-48dd-99ed-75a22b0e3aaa', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001573', NULL, 'Lincomycin 500mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('97bb6a01-51b8-4fc9-b594-8da54e5302a5', 'ee6b02f3-dcfd-48dd-99ed-75a22b0e3aaa', 'Viên', 1, true, 1040, 1500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('b3a99f5b-a2cf-4f65-8c2f-b4cbfba4a7df', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP001572', NULL, 'Bông 50G', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('f349c431-3f54-4497-8713-ff66e6fc8cbe', 'b3a99f5b-a2cf-4f65-8c2f-b4cbfba4a7df', 'Gói', 1, true, 10900, 15000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('5a10f9bc-4ac6-4af2-b5fa-dfb1ff20ff09', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP001571', NULL, 'Gạc tẩm Cồn', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('c3665d29-a9c8-49b2-82e2-2ca3716a3bcc', '5a10f9bc-4ac6-4af2-b5fa-dfb1ff20ff09', 'Hộp', 1, true, 16700, 0);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('8f53e4d9-bced-4a8b-aa7b-d61d70d6618f', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP001570', NULL, 'Thuốc Liều 11k', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('a41da8f6-7d75-4c23-a89d-ef35d34050a5', '8f53e4d9-bced-4a8b-aa7b-d61d70d6618f', 'Viên', 1, true, 7000, 11000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('156532a2-01e1-4ed6-b9b6-ec5c08b49f2a', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001564', '8936024390532', 'Meshanon 60mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('7451b6c2-c6bb-4f2f-a21f-f4ae836ed9be', '156532a2-01e1-4ed6-b9b6-ec5c08b49f2a', 'Viên', 1, true, 4540, 5000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('5042901d-118b-4b37-88ed-0075a58ee9f6', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001561', NULL, 'Voltaren 75mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('8392d564-52ec-4ec2-b5b5-641249f3483b', '5042901d-118b-4b37-88ed-0075a58ee9f6', 'Viên', 1, true, 6600, 7000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('0357351b-03ef-49f8-80ce-af5877bffef2', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001557', NULL, 'Voltaren 50mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('7e28afc7-3a8b-40f3-be89-4ab7adc34763', '0357351b-03ef-49f8-80ce-af5877bffef2', 'Viên', 1, true, 3750, 4000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('5bf46c6d-efd6-4b85-bf26-02d78309b61f', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001554', NULL, 'Allopurinol 300mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('665b3344-5cc5-48fa-a342-6d7b3ec82f2b', '5bf46c6d-efd6-4b85-bf26-02d78309b61f', 'Viên', 1, true, 700, 1000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('7ef940c0-0068-44bc-83d3-02db89f06cac', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001551', '8936085367795', 'Sinlukast 10mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('5e3b7a0e-5fa7-4c82-ab73-7825e41f3fc3', '7ef940c0-0068-44bc-83d3-02db89f06cac', 'Viên', 1, true, 1520, 2000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('27201186-3b4e-45ca-97ee-23611e68fbf0', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001546', NULL, 'Stadovas 5mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('25d555b2-da0d-43b8-9fd1-58e3250c686c', '27201186-3b4e-45ca-97ee-23611e68fbf0', 'Viên', 1, true, 680, 800);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('a7f0cd3c-0392-410f-ba72-120f4ad095a9', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001544', NULL, 'Rectiofa 5', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('021651e2-8c77-4c2a-bc29-3258f6af88ac', 'a7f0cd3c-0392-410f-ba72-120f4ad095a9', 'Ống', 1, true, 4000, 4500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('40ac1dbb-ead0-4249-838b-8a05b437dd0a', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001541', NULL, 'Betaloc Zok 25mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('73b69b08-4e87-4149-b5ae-b9b85814395f', '40ac1dbb-ead0-4249-838b-8a05b437dd0a', 'Viên', 1, true, 5135, 5357);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('272de060-3ae8-40b6-9115-84de4dd330d1', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001536', '8936098965087', 'Zensalbu 2.5mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('e9a91dc1-982c-46a5-8fee-31127e9b8358', '272de060-3ae8-40b6-9115-84de4dd330d1', 'Ống', 1, true, 4200, 5000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('a7db1464-2255-4b12-af26-60a71df5d763', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP001534', '8935131206156', 'Omega 3', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('395b1713-8031-4fdb-922a-212d02cd703a', 'a7db1464-2255-4b12-af26-60a71df5d763', 'Viên', 1, true, 1500, 2000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('6aa9f5db-5385-45f3-980c-7bed62d27709', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP001525', '8936031641863', 'Ginkgo 12k', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('54384cec-2e88-44b4-b842-fab0f077afef', '6aa9f5db-5385-45f3-980c-7bed62d27709', 'Viên', 1, true, 800, 1200);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d0adb5fe-b03f-4f7c-a9f6-2b5b55d1e762', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP001523', NULL, 'Hoạt huyết dưỡng não Đại Uy', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('d1a51a18-bdce-4ad8-96fd-a4de75f4b999', 'd0adb5fe-b03f-4f7c-a9f6-2b5b55d1e762', 'Vỉên', 1, true, 325, 400);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('194a7bd6-0d84-49d3-906c-6cad7efe4d65', '80b8c40b-e414-4042-87ef-8ed5adff3c81', 'SP001522', NULL, 'Miếng Dán Cọp', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('12e163bd-7649-41c6-a3c9-f45e70c2ea62', '194a7bd6-0d84-49d3-906c-6cad7efe4d65', 'Gói', 1, true, 7000, 8000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('81796b73-86de-4963-bb32-59f854cd9b52', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001519', '3384573', 'Tanganil 500mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('73f1cf98-48a6-4689-bd37-026d5911f094', '81796b73-86de-4963-bb32-59f854cd9b52', 'Viên', 1, true, 4390, 5000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('b50a5756-cbad-4214-8ecc-e7fd99075299', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001514', '8934903003009', 'Otilin 15ml', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('8085f8d1-1e18-4f10-ba13-4cda1b30eea8', 'b50a5756-cbad-4214-8ecc-e7fd99075299', 'Lọ', 1, true, 20000, 22000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('9f7f6ff4-ae8e-4a80-b680-e6548a3fefa5', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP001510', NULL, 'Băng Thun 3 Móc', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('5dcae903-6cab-4348-a7d8-e9cfdb5b7ff0', '9f7f6ff4-ae8e-4a80-b680-e6548a3fefa5', 'Gói', 1, true, 3000, 5000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('6da55951-acd1-4cbb-97f8-1c2a80eaf196', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001508', '8935071404018', 'Maxgel', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('d93b2448-3828-48dd-95ff-157b077203cc', '6da55951-acd1-4cbb-97f8-1c2a80eaf196', 'Tuýp', 1, true, 13000, 15000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('6d653f23-1c26-466d-98fe-feef0de4c067', '80b8c40b-e414-4042-87ef-8ed5adff3c81', 'SP001505', '8938505132174', 'Dầu Gió Xanh Thiên Thảo 12ml', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('d85cc149-3cf8-4d66-bd01-9123c1372695', '6d653f23-1c26-466d-98fe-feef0de4c067', 'Chai', 1, true, 22225, 25000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('b7c6373f-1965-4a4c-ab0d-f29aa1ac1a15', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001501', '8002660025418', 'Duphaston', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('02827455-028b-4d8f-9efa-5c8f5653703e', 'b7c6373f-1965-4a4c-ab0d-f29aa1ac1a15', 'Viên', 1, true, 11285, 12500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('599d5156-b4b2-4f1e-b027-465c2fecfe4f', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP001500', '4014009356880', 'Xịt viga 50000', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('502de24e-06dc-42b8-a8c6-f9853a6a8b1e', '599d5156-b4b2-4f1e-b027-465c2fecfe4f', 'Chai', 1, true, 0, 150000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('6145cd9a-9148-4870-95c4-a0b77c443be1', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP001498', '8938542880540', 'Viên Ngậm Ho Nam Dược', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('bd870e9e-109a-4186-8e07-008e76845393', '6145cd9a-9148-4870-95c4-a0b77c443be1', 'Vỉ', 1, true, 7000, 10000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('5e8e2f46-59fe-41ba-8788-abc0c3dcc09b', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001495', NULL, 'Sildenafil 100', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('8eba824a-fa3b-4ca5-8272-e7373813b94d', '5e8e2f46-59fe-41ba-8788-abc0c3dcc09b', 'Viên', 1, true, 8000, 30000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('8b03898d-22e8-4ea3-8975-86a934efd937', '80b8c40b-e414-4042-87ef-8ed5adff3c81', 'SP001494', NULL, 'Vaseline Hương Dâu', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('b4ab1a50-800b-43af-9eb0-54341dca68a4', '8b03898d-22e8-4ea3-8975-86a934efd937', 'Tuýp', 1, true, 8400, 15000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('55e63ca1-7e85-4ab0-9e3e-e34b58c85315', '80b8c40b-e414-4042-87ef-8ed5adff3c81', 'SP001493', '8936036961232', 'Asa 12ml', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('017ac2fd-0c9b-4f9d-a968-0c31bc2c4b09', '55e63ca1-7e85-4ab0-9e3e-e34b58c85315', 'Chai', 1, true, 6300, 10000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('621f75cd-9f18-4353-aad6-2f1283e5b6e7', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001490', NULL, 'Berocca', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('69cfbd02-65de-46fd-a2e3-ef9374f9188d', '621f75cd-9f18-4353-aad6-2f1283e5b6e7', 'Viên', 1, true, 7000, 7500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('a5aff829-47ca-4029-9f7c-6b95ffc829bd', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP001488', '8936040074003', 'Bông 25g', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('15f38e99-d1ac-40f2-ad21-ae4ba382fa3f', 'a5aff829-47ca-4029-9f7c-6b95ffc829bd', 'Gói', 1, true, 5000, 8000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('e0e0b301-347e-4b32-817c-ece7f20a062a', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP001484', NULL, 'Jex (Nhỏ )', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('6ed59ff3-8798-4f29-91b9-846ed7b45a0c', 'e0e0b301-347e-4b32-817c-ece7f20a062a', 'Viên', 1, true, 295500, 11333);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('9fedaaf8-e2f1-4b91-856d-a148e2cca93f', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP001483', '8936040074355', 'Bông viên', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('e55789c2-2352-4766-bf19-c2cf5a1a8b9c', '9fedaaf8-e2f1-4b91-856d-a148e2cca93f', 'Gói', 1, true, 0, 10000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('dfea4715-3a9b-4e23-ac28-03f3f23776f0', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP001480', '8936109560287', 'Men Biolac Plus', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('b82ff2cd-2368-403a-9dfe-a92dbe331181', 'dfea4715-3a9b-4e23-ac28-03f3f23776f0', 'Viên', 1, true, 500, 1000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('5495a819-13d4-41a1-ba05-83a40ccf165e', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001472', NULL, 'Levothyrox 50', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('4a177a20-1a04-4406-9eb9-f3a14b34d847', '5495a819-13d4-41a1-ba05-83a40ccf165e', 'Viên', 1, true, 1293, 1666);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('e7db1da8-fb68-4027-b519-578a241ca92d', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001470', '8936145281030', 'Sorbitol 5g', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('7268be53-0744-457f-88c8-5e74d490cfab', 'e7db1da8-fb68-4027-b519-578a241ca92d', 'Gói', 1, true, 1310, 2500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('4db2c705-138b-4dab-84fe-d666895e9fda', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001468', '8935269911113', 'Diosmectite 3g', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('12e01b1e-5c19-40f8-97f6-9a0ab1d83091', '4db2c705-138b-4dab-84fe-d666895e9fda', 'Gói', 1, true, 1850, 3000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('efaf12f7-28e5-4463-a4c6-56c031d826cb', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001465', NULL, 'Pruzitin', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('516d4d2b-4976-484c-9794-b1dc961b6b3b', 'efaf12f7-28e5-4463-a4c6-56c031d826cb', 'Viên', 1, true, 250, 500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('13018379-1115-4bed-a6fe-bad595f54a61', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001462', NULL, 'Kamelox 15', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('5913b0eb-71bc-4231-a04f-5465823a08e7', '13018379-1115-4bed-a6fe-bad595f54a61', 'Viên', 1, true, 210, 500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('8f47a4f9-b210-4e40-aeb9-afb9e540f3d7', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001459', '8936014585368', 'Atheren', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('33ae276c-2e2c-4b36-8399-4bf513fcf362', '8f47a4f9-b210-4e40-aeb9-afb9e540f3d7', 'Viên', 1, true, 390, 600);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('fa7ed0ba-204f-4ef7-a175-f40c6bc5476f', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP001456', '8936010467019', 'Vitamin PP 5mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('79cf575d-e961-4855-bfb3-2b566bdb49a1', 'fa7ed0ba-204f-4ef7-a175-f40c6bc5476f', 'Viên', 1, true, 251, 500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('46fe8513-669f-4c75-981a-656ece032aee', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001453', '8935206020823', 'Telfor 120mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('5f0eb339-0d97-4f23-a93c-bc3f09de843a', '46fe8513-669f-4c75-981a-656ece032aee', 'Viên', 1, true, 2480, 2600);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('e8776ffe-5c52-44c5-90c7-1adbc0fad6b5', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001450', '8935206020816', 'Telfor 60mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('7e80ca3d-e958-48a8-a0d7-36257376c9c5', 'e8776ffe-5c52-44c5-90c7-1adbc0fad6b5', 'Viên', 1, true, 1365, 2000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('bcf9ae6b-7d61-4df4-87b1-4fb7ba6268aa', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001449', NULL, 'Fugacar 500mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('cb944a10-3d3d-4d31-9b00-c1a42a0ca564', 'bcf9ae6b-7d61-4df4-87b1-4fb7ba6268aa', 'Hộp', 1, true, 21200, 25000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('157c13e0-ab5b-4a0c-a87c-5a3e0ae5d37f', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001447', NULL, 'Smecta 3g', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('7cf5fd32-3d6b-4425-8c5f-a81ddb887b7f', '157c13e0-ab5b-4a0c-a87c-5a3e0ae5d37f', 'Gói', 1, true, 4600, 5000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('5c1fad2c-9487-438b-9d90-d73e5b9a2060', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP001445', '8936123411442', 'Enterogermina', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('9fbb2cc3-d1ae-446d-8435-7ba3403d295c', '5c1fad2c-9487-438b-9d90-d73e5b9a2060', 'Ống', 1, true, 8200, 9000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('faa7ee84-31f7-4186-88b6-6fda021ce069', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001442', NULL, 'Bisacodyl', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('d05a311d-ce6d-4784-9be5-8fc4a1c700b4', 'faa7ee84-31f7-4186-88b6-6fda021ce069', 'Viên', 1, true, 592, 700);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('7f7b51a3-0e27-4e39-8799-9c07ffdf2ef1', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001439', NULL, 'Clorpheniramin 4mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('1e82273e-c73e-4355-90c4-cff93fd5636c', '7f7b51a3-0e27-4e39-8799-9c07ffdf2ef1', 'Viên', 1, true, 67, 150);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('47e6c130-783d-443b-8d7c-24147b243b56', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP001435', '8936098967296', 'Companity', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('51895d08-b1f8-468d-ab3b-c14a8401e18d', '47e6c130-783d-443b-8d7c-24147b243b56', 'Gói', 1, true, 4100, 6000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d810bd58-09c4-48e4-b401-3c6a9c6a94f9', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001432', NULL, 'Ampicilin 500mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('0e9d5542-f3a5-4b28-8ada-1ad7b375c53f', 'd810bd58-09c4-48e4-b401-3c6a9c6a94f9', 'Viên', 1, true, 734, 1000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('bc497459-83c7-46b1-b4f8-d7945b768027', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001426', '8935206020830', 'Telfor 180mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('2112fa0e-fd95-4da5-973f-c643b2c9d11f', 'bc497459-83c7-46b1-b4f8-d7945b768027', 'Viên', 1, true, 2850, 3200);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('71111dd6-7755-4837-b797-bd4d1c311619', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001423', NULL, 'Berberin', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('edbf5f3a-3e46-4774-9fde-80039935bb5b', '71111dd6-7755-4837-b797-bd4d1c311619', 'Viên', 1, true, 0, 600);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('f20e46f5-fb50-4d66-9a55-0fb1c177eeee', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001420', '882844', 'Midasol', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('48f00551-153a-4b0b-b231-52b729bd2cf2', 'f20e46f5-fb50-4d66-9a55-0fb1c177eeee', 'Viên', 1, true, 1667, 2000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('442558e1-3c79-4a31-a90f-3cf3e9eaca35', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001419', '8935071408016', 'Pentinox 400mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('ccdf1640-e8fa-4f99-8052-19b593e8ac68', '442558e1-3c79-4a31-a90f-3cf3e9eaca35', 'Viên', 1, true, 5350, 10000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('f133e51d-4d29-4b55-8eb4-560abeaaab18', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001416', '8935244600858', 'Alpha chymotrypsin', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('85d35c74-f499-45f4-88fd-b2a09ed05b8c', 'f133e51d-4d29-4b55-8eb4-560abeaaab18', 'Viên', 1, true, 200, 500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('7f7c6fd0-513f-417b-bdff-9e953a608525', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001414', '8002660041920', 'Duphalac', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('e3e76247-6888-4654-a6f6-389980e2e9dc', '7f7c6fd0-513f-417b-bdff-9e953a608525', 'Gói', 1, true, 6835, 7500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('c5147b89-7e4a-49da-9989-6c4f093a2b53', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP001412', '8938501045119', 'Vitamin 3B Daktin', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('e2994f51-4c73-4e7d-9aa3-f2d8c4e51014', 'c5147b89-7e4a-49da-9989-6c4f093a2b53', 'Viên', 1, true, 220, 500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('35688da8-1943-4c88-a208-3d495013f6b4', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001409', '8936064217530', 'Agifuros 40mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('459bc08c-443c-4023-b954-f25bffd62f7b', '35688da8-1943-4c88-a208-3d495013f6b4', 'Viên', 1, true, 184, 250);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('7bb65f58-0c02-42d7-b87b-53d01a21b61c', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP001407', '8934690101377', 'Oresol new', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('c57d1b7c-0c7c-4af8-b00f-cdbb1441eb18', '7bb65f58-0c02-42d7-b87b-53d01a21b61c', 'Gói', 1, true, 1105, 2500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('4cda267a-301e-4651-b78d-6fde5ee57eb2', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001404', '8935206016376', 'Omeprazol DHG', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('802b07ee-64f3-4c46-bee0-00c919263349', '4cda267a-301e-4651-b78d-6fde5ee57eb2', 'Viên', 1, true, 726.7, 1000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('80bace75-b9be-440d-8f4c-a317d474665f', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP001401', NULL, 'Dizzo', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('5fffd09e-d44c-4645-9722-9458a4126a85', '80bace75-b9be-440d-8f4c-a317d474665f', 'Viên', 1, true, 3633, 4000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('639babe9-5b62-4437-b181-9160cbb9430e', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001395', NULL, 'Vitamin C 500mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('3b6451b9-292d-4ddb-85f9-7cc82451a9f3', '639babe9-5b62-4437-b181-9160cbb9430e', 'Viên', 1, true, 329, 500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('e00a10e7-0684-48d3-96a4-e4e6c074ad23', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001389', '8936123411176', 'Nautamine', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('d7e8ba0b-eb1a-4a91-ac7d-c5c9748f2e0b', 'e00a10e7-0684-48d3-96a4-e4e6c074ad23', 'Viên', 1, true, 2968, 4000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('4281e779-c119-41ad-968d-4c44d14d27f5', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001386', NULL, 'Amitriptylin 25mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('83633bc4-608a-44ac-af4b-82df86eb97c1', '4281e779-c119-41ad-968d-4c44d14d27f5', 'Viên', 1, true, 206, 500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('519abd5f-d630-47bd-b05b-7c07cfa785c4', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001380', '99160364', 'Stugeron', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('d0b671ad-5d82-43fa-8d5a-54af2a5e6e4d', '519abd5f-d630-47bd-b05b-7c07cfa785c4', 'Viên', 1, true, 743, 1000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('8a9690a2-2ac4-448c-ad28-d68e73b6137d', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001378', '8936098963489', 'Ginsil', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('268d763b-6601-4e7b-b56a-19fb21b35bcd', '8a9690a2-2ac4-448c-ad28-d68e73b6137d', 'Ống', 1, true, 3000, 6000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('db0de0e6-26dc-4b44-ac30-e188d13cf95d', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001372', '8936064210975', 'Agicetam 800', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('045f0454-761e-4a84-a2e6-588456b5f429', 'db0de0e6-26dc-4b44-ac30-e188d13cf95d', 'Viên', 1, true, 890, 1000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('64a3f101-16c8-4c67-aa08-5c02e50715fe', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001369', NULL, 'Tanponai 500mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('1574fb1e-a547-4e4a-a803-c4974d5192d6', '64a3f101-16c8-4c67-aa08-5c02e50715fe', 'Viên', 1, true, 425, 1500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('67136254-f331-42be-981b-e5eadacc39bf', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001366', '8934567001267', 'MIMOSA VIÊN AN THẦN', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('006da160-61b4-44a2-a9a8-350e89b905b6', '67136254-f331-42be-981b-e5eadacc39bf', 'Viên', 1, true, 831, 2000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('5f572558-688c-49b5-b04f-6420fb23ba1f', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001363', NULL, 'Magnesium-B6', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('279b2142-ffc1-4067-93c3-ed74f7b80e0a', '5f572558-688c-49b5-b04f-6420fb23ba1f', 'Viên', 1, true, 800, 1000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('82f3f47a-3fb3-4fce-8be8-366457d56f67', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001362', '8936008134466', 'Dimedrol ( Thuốc Tiêm )', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('12febb62-365b-42a1-8cc8-e09c0cf13163', '82f3f47a-3fb3-4fce-8be8-366457d56f67', 'Ống', 1, true, 1000, 50000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('52a1fed5-562e-400a-b8b4-3a7856b13986', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001356', '8935049904083', 'Trihexyphenidyl', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('937ff487-c687-4b50-b0fd-e5163d8f3c47', '52a1fed5-562e-400a-b8b4-3a7856b13986', 'Viên', 1, true, 178, 250);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('89a592c6-a5bf-4ad7-85e6-a6f16793d1a7', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001352', '8936004133128', 'Neo-megyna', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('bb49a4b7-94bc-4939-a444-df17827fc750', '89a592c6-a5bf-4ad7-85e6-a6f16793d1a7', 'Viên', 1, true, 2380, 5000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('b7250203-2d29-49ea-838a-2740f415b33e', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001344', '8936123411206', 'Magne B6 corbiere', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('1e276d42-7087-452b-ad52-f06857856573', 'b7250203-2d29-49ea-838a-2740f415b33e', 'Viên', 1, true, 1938, 2100);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('a36f4390-7b30-4770-9164-dc4fb0c3897d', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001341', NULL, 'Betaserc 16mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('35df4b9c-5a0b-4bec-8a6e-cc019d406c51', 'a36f4390-7b30-4770-9164-dc4fb0c3897d', 'Viên', 1, true, 3833, 4000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('acc44118-098d-48cd-a7cc-7fdbcc808d26', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001338', '8846000182726', 'Bromalex', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('4f649406-c587-4a70-9262-d1b8860cb6f6', 'acc44118-098d-48cd-a7cc-7fdbcc808d26', 'Viên', 1, true, 5700, 15000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('e13e8569-3a22-455f-ada9-c33a83456bff', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001335', '8936061376919', 'Masopen 250/25', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('6da187ad-4c7a-4aa3-bd6e-9d3f4ebf22b6', 'e13e8569-3a22-455f-ada9-c33a83456bff', 'Viên', 1, true, 4000, 4333);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('310d14ea-7b54-4d0b-b420-5c287b07f448', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001333', NULL, 'Meyermazol 500', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('8bc771f2-281d-4a1f-964a-5c8ac8a78c07', '310d14ea-7b54-4d0b-b420-5c287b07f448', 'Viên', 1, true, 6300, 7500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('dadefabb-b912-4e7c-8a2f-5458f484b4c6', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001330', '8936134270991', 'Mezapizin 10', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('50c29cec-fd70-4912-83bf-015c095953e2', 'dadefabb-b912-4e7c-8a2f-5458f484b4c6', 'Viên', 1, true, 835, 1000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('a866b693-08b4-4f10-9007-c6ba372ab07e', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001329', '28068726', 'Becozyme', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('23cade24-08b2-4f3d-8ba7-40fbcabb8bef', 'a866b693-08b4-4f10-9007-c6ba372ab07e', 'Ống', 1, true, 13750, 80000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('af0d126e-b15e-4a65-8862-b764f86a0a23', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001323', NULL, 'Panadol Extra', true, 'f3626e87-aa48-4356-bb99-aeb36029ed3c', 'Extra');
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('15ebed85-7d23-4e1a-a2c9-f73a7d44c589', 'af0d126e-b15e-4a65-8862-b764f86a0a23', 'Viên', 1, true, 1277, 1333);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('c5c8c9bd-2680-441b-a60c-ba56d7bfbe09', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001319', NULL, 'Panadol', true, 'f3626e87-aa48-4356-bb99-aeb36029ed3c', 'Mặc định');
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('1728971b-e4cd-4b76-8d81-2729e5dc1324', 'c5c8c9bd-2680-441b-a60c-ba56d7bfbe09', 'Viên', 1, true, 875, 1000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('2ab8342f-ce6b-43d8-85a1-9e88f2a0a0f7', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001296', '8936106320679', 'Enalapril Stella 10mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('8598ae5c-32e4-4cdd-b9e2-a4a440d642fb', '2ab8342f-ce6b-43d8-85a1-9e88f2a0a0f7', 'Viên', 1, true, 960, 1300);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('9d68ded5-2b6e-484f-8fe8-4fada8c8010a', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001293', NULL, 'Furosemid 40mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('2cddc3e8-fcd9-4a80-94fc-6ddcd4781df7', '9d68ded5-2b6e-484f-8fe8-4fada8c8010a', 'Viên', 1, true, 236, 400);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('ce3c4584-f8a2-494b-b6aa-9df053336a38', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001287', '14012595', 'Vastarel MR 35mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('d47f5cd6-4f66-45b9-b089-6b227067f713', 'ce3c4584-f8a2-494b-b6aa-9df053336a38', 'Viên', 1, true, 3000, 3100);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('c03a60a5-1e52-4689-8455-990f437286e4', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001284', '8935206007831', 'Apitim 5', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('87118529-e1a1-45a3-9641-2d957452577d', 'c03a60a5-1e52-4689-8455-990f437286e4', 'Viên', 1, true, 737, 800);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('ca922e06-0a9a-49e7-8eac-a1d546c6eb46', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001281', '8936134272247', 'Beynit 5', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('618be496-e4d4-405c-b6fd-28cf7720049e', 'ca922e06-0a9a-49e7-8eac-a1d546c6eb46', 'Viên', 1, true, 2262, 2500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('57920e19-7634-4a42-85e8-76c723285060', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001275', '8936004136013', 'DigoxineQualy', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('938c3721-720f-45d4-85ee-d013ba0ec1b6', '57920e19-7634-4a42-85e8-76c723285060', 'Viên', 1, true, 713, 1000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d64f086e-da35-48b7-84de-40df33bfb199', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001273', '14014509', 'Coversyl 5mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('e0109b57-6efd-409a-8b37-db8691d0b904', 'd64f086e-da35-48b7-84de-40df33bfb199', 'Viên', 1, true, 6800, 7000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('c3ff1387-e69f-4b6f-aed7-e39becec2e14', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001270', NULL, 'Concor Cor 2.5mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('0eb42919-632f-4370-9363-82489149283c', 'c3ff1387-e69f-4b6f-aed7-e39becec2e14', 'Viên', 1, true, 3230, 3500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('87e8ed36-3763-49a2-84a2-955ac4a9a73c', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001264', '8936061371099', 'Migomik', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('7c75b830-7ede-461a-8742-d7a38ac6e734', '87e8ed36-3763-49a2-84a2-955ac4a9a73c', 'Viên', 1, true, 2100, 2500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d70d10c3-40c1-4874-a2ad-418b0b0e3241', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001261', '8936024390600', 'Bihasal 2.5', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('e58c94d4-a43e-4d8e-aa29-69db2c78b04f', 'd70d10c3-40c1-4874-a2ad-418b0b0e3241', 'Viên', 1, true, 1100, 1200);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('07e3d548-4e49-4832-8be6-f1a946d3b897', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001255', '8936106320723', 'Nifedipin T20 Stella', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('fae9f718-6ab8-4621-8be7-e7ee8b17d530', '07e3d548-4e49-4832-8be6-f1a946d3b897', 'Viên', 1, true, 661, 700);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('26396b4d-152f-4b81-9830-548769bfed2d', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001252', '14010769', 'Daflon 500mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('ac973e0a-f737-44f9-a4c0-09d688984ce3', '26396b4d-152f-4b81-9830-548769bfed2d', 'Viên', 1, true, 4500, 4800);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('cf13315f-caf5-4ff5-95a7-764e4cd34263', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001246', NULL, 'Hyzaar 50mg/12.5mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('2a6e62f7-80f2-4747-85bf-2cc5b446191b', 'cf13315f-caf5-4ff5-95a7-764e4cd34263', 'Viên', 1, true, 8300, 8900);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('930ee7cd-0305-4ec4-ac2d-f6a433c711f5', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001243', '8936134270663', 'Telzid 40/12.5', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('d0146569-dea6-4d69-ad74-64dd8f40913a', '930ee7cd-0305-4ec4-ac2d-f6a433c711f5', 'Viên', 1, true, 10600, 1500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('879f8abb-d3a0-45b8-84a4-ff8d57ce75cd', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001240', '8936022470687', 'COMBIZAR', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('37a33e0b-783c-4dce-afa2-9918fea9cef1', '879f8abb-d3a0-45b8-84a4-ff8d57ce75cd', 'Viên', 1, true, 0, 2830);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('4396d24c-b6b5-49d4-a50e-e4676a03a995', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001237', '8936061372171', 'Vecarzec 5', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('2e8f9072-f978-4494-a7ec-24e0a27947d5', '4396d24c-b6b5-49d4-a50e-e4676a03a995', 'Viên', 1, true, 0, 6000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('b4a2ba5e-7657-4fbb-a6e5-8512d20fcdff', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001234', '8936106320181', 'Felodipine Stella 5mg retard', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('d267a47c-e5e6-4ad9-81c0-4798012196bb', 'b4a2ba5e-7657-4fbb-a6e5-8512d20fcdff', 'Viên', 1, true, 1455, 1700);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('688f2e8e-8b99-4c2f-9675-225f02ff83f4', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001228', '8936024391478', 'Imidu 60 mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('89546720-cae3-4ef3-a675-480a2d459226', '688f2e8e-8b99-4c2f-9675-225f02ff83f4', 'Viên', 1, true, 2410, 2500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('f17c2422-e2f8-4f0d-999e-295f5b520e45', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001222', '8936106320594', 'Captopril stella 25mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('dcfe7219-f0de-449a-9ead-b2f9ffd807e5', 'f17c2422-e2f8-4f0d-999e-295f5b520e45', 'Viên', 1, true, 550, 600);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('753bd598-5552-4b68-8ebb-6805cff58453', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001219', '8934618001727', 'Dopolys', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('c3c5ae45-ed58-4738-83f2-0c22647a1f37', '753bd598-5552-4b68-8ebb-6805cff58453', 'Viên', 1, true, 2780, 4000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d4352042-ee5a-4901-b30d-2716dfeec617', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001216', '8936024394783', 'Vashasan MR 35mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('fc2d2f80-ad0f-43a9-b61c-d78dba8cfe0d', 'd4352042-ee5a-4901-b30d-2716dfeec617', 'Viên', 1, true, 1147, 1300);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('bdc9f68d-8972-4364-9705-483b1bb18aa8', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001213', '8936106320761', 'Lostad T50', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('134da0fe-c926-4b62-b428-24e4250f908b', 'bdc9f68d-8972-4364-9705-483b1bb18aa8', 'Viên', 1, true, 2243, 2600);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('e5a22ed0-a9c2-4765-9fac-adde1cfcf58b', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001210', '8936029641622', 'Vataseren', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('61280c8f-df24-46a1-8674-4357d38a1be3', 'e5a22ed0-a9c2-4765-9fac-adde1cfcf58b', 'Viên', 1, true, 273, 330);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('1ddb8763-51fe-4024-ba55-4ed7d6d4f0dc', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001208', NULL, 'Coveram 5mg/5mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('ed1e0ecb-aa17-4d4d-889a-4cbba66ee3d1', '1ddb8763-51fe-4024-ba55-4ed7d6d4f0dc', 'Viên', 1, true, 8347, 9000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('a106d173-0251-4d5a-b22f-37fbf24bb806', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001205', '8936024394264', 'Nifedipin Hasan 20 Retard', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('671f8b76-780d-4122-b265-46b9781a99ec', 'a106d173-0251-4d5a-b22f-37fbf24bb806', 'Viên', 1, true, 540, 600);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('91fe3d68-c1b0-4d3f-81d8-05e9b212daba', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001202', '8901120160976', 'Amlodac 5mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('dc58715b-7985-4356-a041-658555202d0e', '91fe3d68-c1b0-4d3f-81d8-05e9b212daba', 'Viên', 1, true, 270, 400);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('6a35247c-3406-4737-900f-d3b4198111ff', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001199', NULL, 'Perimirane 10mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('af23d277-8cd9-4762-9d16-1a9dedc914f6', '6a35247c-3406-4737-900f-d3b4198111ff', 'Viên', 1, true, 328, 750);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('c92a26af-e909-4f2b-a61e-4bac46c2f792', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001197', NULL, 'Coversyl Plus 5mg/1.25mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('778cb4d7-a157-409c-aed9-608fdfb84bb8', 'c92a26af-e909-4f2b-a61e-4bac46c2f792', 'Viên', 1, true, 8183, 8500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('52ff9e00-f8f0-4d5b-b473-96749815e216', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001194', '8936134270793', 'Telzid 80/12.5', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('e10f704b-9f0b-4f13-8f60-bbd33f4bf751', '52ff9e00-f8f0-4d5b-b473-96749815e216', 'Viên', 1, true, 2055, 2500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('a654fb42-6754-4de0-8b3c-e082d7df8769', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001191', '8934690110881', 'Ambidil 5mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('f9c77cc4-23ef-4ce5-9e06-cf8aa77177a4', 'a654fb42-6754-4de0-8b3c-e082d7df8769', 'Viên', 1, true, 550, 700);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('141d2295-5aa7-4e0b-8f1f-1a0bd52dd855', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001188', NULL, 'Meyerflavo', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('1ac481bc-d961-4476-906f-7cd65d67908a', '141d2295-5aa7-4e0b-8f1f-1a0bd52dd855', 'Viên', 1, true, 3643, 5000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('3dd9bc60-a1e6-4e93-b787-57573afb2d62', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001182', '8936134272230', 'Beynit 2.5mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('d3beb0fd-8d13-4cdf-9008-f300bb3552d1', '3dd9bc60-a1e6-4e93-b787-57573afb2d62', 'Viên', 1, true, 2077, 2400);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('9ae85c21-ae38-484b-b6f0-3c485ec57871', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001176', '8936014582497', 'Atenolol Stada 50mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('70dd5efc-4eb0-4f22-9b3e-dc241a70bb68', '9ae85c21-ae38-484b-b6f0-3c485ec57871', 'Viên', 1, true, 780, 1000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('69f04f21-c77e-40ec-a665-f415afc95eaa', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001174', NULL, 'Eszonox 2mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('3e306264-52c6-4707-bf1c-bee9e12b7b1a', '69f04f21-c77e-40ec-a665-f415afc95eaa', 'Viên', 1, true, 850, 2000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('647dff83-727f-47c1-8cfd-e958ad65b3a0', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001171', '8936024390792', 'Bihasal 5mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('99a70d6e-54b8-4b26-b49a-c9c092254abf', '647dff83-727f-47c1-8cfd-e958ad65b3a0', 'Viên', 1, true, 1414, 1600);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('1b52850b-d86e-40d2-96f6-86290b699c86', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001165', NULL, 'Aescin 20mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('05514c5b-814c-496e-bc02-61d0220cc54d', '1b52850b-d86e-40d2-96f6-86290b699c86', 'Viên', 1, true, 1681, 2000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('a1901543-e360-418c-a742-8d19bf0e7975', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001162', '8936106324592', 'Enalapril Stella 5mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('e1330ecf-204a-42ef-be7d-1184e1b56ff5', 'a1901543-e360-418c-a742-8d19bf0e7975', 'Viên', 1, true, 727, 900);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('1c3ddf43-ca0e-439c-b98c-edcc86f88b07', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001159', '8936014583913', 'Daflavon', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('67344899-dba0-49cf-b640-f92897f40c91', '1c3ddf43-ca0e-439c-b98c-edcc86f88b07', 'Viên', 1, true, 1794, 2000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('a321e7fb-aff2-409a-a035-f83399ff30e0', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001153', '99029623', 'Exforge 5/80mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('32f0a791-9b05-40d4-a923-86e4af26299f', 'a321e7fb-aff2-409a-a035-f83399ff30e0', 'Viên', 1, true, 10500, 11000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('bfb23ae0-10c8-4a62-ae44-0c10792e8cda', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001150', '8936106320907', 'Lostad HCT 50/12,5mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('94499d3c-3ed3-4491-88f4-c8c8e39eb423', 'bfb23ae0-10c8-4a62-ae44-0c10792e8cda', 'Viên', 1, true, 2563, 2700);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('ffe65088-5d4b-4fdf-b8a8-7a6988f6e6e1', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001147', '8934690010945', 'Atorlog 20mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('6052c875-265d-4725-9c5d-6e7ee35828a6', 'ffe65088-5d4b-4fdf-b8a8-7a6988f6e6e1', 'Viên', 1, true, 1333, 2000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('13d3176b-3c8a-4119-8045-315c6a3f5701', 'bcdbf0bd-cdd8-4e67-87eb-c654494ef3bb', 'SP000001', NULL, 'Strepsils cool (Gói)', true, 'f83ad115-c367-46d1-b6e3-bce4b948ce2f', 'cool (Gói)');
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('718384c0-f6c6-40eb-8f08-c36629b24b67', '13d3176b-3c8a-4119-8045-315c6a3f5701', 'Gói', 1, true, 3520, 5000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('8da270a6-c8bd-436b-adcf-36aba8985361', 'bcdbf0bd-cdd8-4e67-87eb-c654494ef3bb', 'SP001144', NULL, 'Strepsils Original', true, 'f83ad115-c367-46d1-b6e3-bce4b948ce2f', 'Original');
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('f12d50f7-2d7a-4086-a590-b03ccb5b7546', '8da270a6-c8bd-436b-adcf-36aba8985361', 'Gói', 1, true, 3520, 5000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('04b851aa-0e7b-4654-aa5d-708a42e5b077', 'bcdbf0bd-cdd8-4e67-87eb-c654494ef3bb', 'SP001143', '96118511', 'Kẹo con tàu', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('052dcceb-1f70-4511-8aec-37d90df9ce8d', '04b851aa-0e7b-4654-aa5d-708a42e5b077', 'Gói', 1, true, 20000, 23000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('58b9680f-cbdd-472a-b7fa-1103230cb58b', 'bcdbf0bd-cdd8-4e67-87eb-c654494ef3bb', 'SP001142', '9555030108581', 'kẹo chanh muối Himalaya', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('cd3bb387-188a-42c3-9c24-4bb70bd57ecd', '58b9680f-cbdd-472a-b7fa-1103230cb58b', 'Gói', 1, true, 7483.3, 8000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('a5459567-65eb-4bbf-bbd0-040413ec22be', 'bcdbf0bd-cdd8-4e67-87eb-c654494ef3bb', 'SP001139', '9556108211349', 'Strepsils cool', true, 'f83ad115-c367-46d1-b6e3-bce4b948ce2f', 'cool');
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('948d484a-4391-485f-a80e-924b8d4b3a2a', 'a5459567-65eb-4bbf-bbd0-040413ec22be', 'Viên', 1, true, 1416, 1666);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('de0f7966-2efc-4b2b-ad3d-34cca1169e70', 'bcdbf0bd-cdd8-4e67-87eb-c654494ef3bb', 'SP001137', '9556108211356', 'Strepsils cam Vitamin C', true, 'f83ad115-c367-46d1-b6e3-bce4b948ce2f', 'cam Vitamin C');
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('097935fc-8ba4-4810-8654-5006cb1f9a3e', 'de0f7966-2efc-4b2b-ad3d-34cca1169e70', 'Viên', 1, true, 1416, 1666);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('9292733c-5158-4c6b-b2f2-b05759d45e6d', 'bcdbf0bd-cdd8-4e67-87eb-c654494ef3bb', 'SP001135', '9556108211325', 'Strepsils Original vỉ', true, 'f83ad115-c367-46d1-b6e3-bce4b948ce2f', 'Original vỉ');
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('3bc8a5c8-fa93-49c1-9579-05e1816a10e1', '9292733c-5158-4c6b-b2f2-b05759d45e6d', 'Viên', 1, true, 1416, 1666);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('32bf4ffa-cc31-487d-8dfb-af31c3eca5bc', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP001134', NULL, 'Otiv h/60v', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('5fc0a0c1-b492-46a6-ade1-a8e9dc963297', '32bf4ffa-cc31-487d-8dfb-af31c3eca5bc', 'Lọ', 1, true, 510000, 590000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('8c0e9b9e-d147-40e4-8e04-b191a0cc4f8d', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP001133', NULL, 'Otiv 30V', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('1ad49c48-835a-4493-980e-001d790e5c37', '8c0e9b9e-d147-40e4-8e04-b191a0cc4f8d', 'Lọ', 1, true, 290000, 330000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('137038bd-0b01-4860-b501-dda09d3e0869', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP001132', NULL, 'Jex 60V', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('20eab16f-8829-4a7e-bd23-916d5d9e69f6', '137038bd-0b01-4860-b501-dda09d3e0869', 'Lọ', 1, true, 609000, 630000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('215846bf-f3f1-47cc-8a9f-4850f48ea0f1', 'bd0319ff-7f2e-4c9f-9c57-245a9d02c38d', 'SP001131', '8850007811251', 'Listerine -coolmint 750ml', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('961fc2c2-de9a-4a9a-a6b1-a77d17391b09', '215846bf-f3f1-47cc-8a9f-4850f48ea0f1', 'Chai', 1, true, 77000, 85000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('fa82a6ce-dd02-4a00-a4ec-089445e46de4', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP001129', '8851401002030', 'Băng cá nhân Urgo trong', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('69257729-f385-4956-b6c6-dcd8c2be0cad', 'fa82a6ce-dd02-4a00-a4ec-089445e46de4', 'Miếng', 1, true, 550, 750);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('304a2ad8-5520-4511-9375-691e3f3f7623', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP001126', '8858419006135', 'Băng cá nhân đỏ', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('3bd36f57-c944-44f0-83a6-d72ae9fc8ee9', '304a2ad8-5520-4511-9375-691e3f3f7623', 'Miếng', 1, true, 500, 670);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('b6f5482e-e0e2-4e40-b889-818e901a2567', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001124', NULL, 'Bozypaine', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('172826ee-e4bb-435e-a6d0-bd53cae1f3ee', 'b6f5482e-e0e2-4e40-b889-818e901a2567', 'Tuýp', 1, true, 25143, 30000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('2062470d-f7e0-4276-812e-8a5ccdaa277a', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP001119', '8938530372484', 'Bổ Mắt Sano Eye', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('d716dd8d-5e13-456d-875c-32ce9cd26a8a', '2062470d-f7e0-4276-812e-8a5ccdaa277a', 'Viên', 1, true, 3500, 5000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('ae808262-5a48-46e8-838d-55b6fbb4134b', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001114', '8936065624191', 'Tinfocool', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('1ee4333f-7b8e-49bf-a434-0974e9c25d63', 'ae808262-5a48-46e8-838d-55b6fbb4134b', 'Gói', 1, true, 7000, 10000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('e773a4c6-d19c-43fc-ae63-6cce40a04718', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001111', '8934618223051', 'Cefalexin 500mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('6893c13b-050d-4215-bd0b-7b04c4b21ad4', 'e773a4c6-d19c-43fc-ae63-6cce40a04718', 'Viên', 1, true, 1100, 1500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('46ebfd6e-0abe-4138-a2be-90629f290fbc', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001108', '8935206026351', 'Mebilax 7,5mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('5582f2df-da49-4831-b285-9b4956755c00', '46ebfd6e-0abe-4138-a2be-90629f290fbc', 'Viên', 1, true, 840, 1000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('bd7df27d-4564-4046-92f0-875abef38785', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001105', '8935206027457', 'Zaromax 500mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('71550103-a408-4db0-9864-17615cf491d0', 'bd7df27d-4564-4046-92f0-875abef38785', 'Viên', 1, true, 4833, 5000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('963e867a-d9d8-40fc-a5b5-57ac3caa6ea1', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001102', '8936035307291', 'Azitnic 250mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('f82cd096-8948-4b3b-9a48-32b7ffb27a66', '963e867a-d9d8-40fc-a5b5-57ac3caa6ea1', 'Viên', 1, true, 2000, 2500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('5d4ee24e-c255-4e0f-840d-7a057f51c5e5', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001099', '8934574080057', 'Amoxicillin 500mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('b9bd35dc-a00c-4246-82fe-b6118403b28f', '5d4ee24e-c255-4e0f-840d-7a057f51c5e5', 'Viên', 1, true, 700, 1000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('f8a1d61a-fb9a-40c1-b26a-7a4b67dcd36f', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001096', NULL, 'Alpha choay', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('2e8b92f2-19bc-4b53-bb80-721e5a8db172', 'f8a1d61a-fb9a-40c1-b26a-7a4b67dcd36f', 'Viên', 1, true, 2173, 2350);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('c8d793ff-0f43-4f25-b445-68f037345afd', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001094', '8936061378500', 'Cantomy Granule 125mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('e2e40e33-ce5c-482b-b3bd-c67238c911a3', 'c8d793ff-0f43-4f25-b445-68f037345afd', 'Gói', 1, true, 2000, 3000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('881ab78e-e0d6-4e3b-9bd7-c503a107aba9', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001082', NULL, 'Hornol', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('70cea9ae-674c-41ba-9c57-9a62b6cee9ef', '881ab78e-e0d6-4e3b-9bd7-c503a107aba9', 'Viên', 1, true, 3733, 4500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('5cfd1fbd-53e7-45f5-a442-e19379225b06', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001075', '99135041', 'Methylprednisolon 4mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('3548fe25-301f-454e-8d0a-046050ff55a0', '5cfd1fbd-53e7-45f5-a442-e19379225b06', 'Viên', 1, true, 305, 1000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('95f4be85-249d-43d2-949a-e4a8960e32b0', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001069', '99149345', 'Ciprofloxacin 500mg Microluss', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('12d200cb-2b3b-4bb0-b008-99f176ca82f9', '95f4be85-249d-43d2-949a-e4a8960e32b0', 'Viên', 1, true, 890, 1000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('53261420-a5fd-4b51-bffe-263e9c51f6c0', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001066', NULL, 'Methylprednisolon 16mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('4276aacd-3650-4def-bd8c-c87032f555b4', '53261420-a5fd-4b51-bffe-263e9c51f6c0', 'Viên', 1, true, 814, 2000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('3453e8b9-2f28-4ee9-a1f6-493e72fc0930', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001063', '8936199490259', 'Cetirizin 10mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('50a1d5d5-1eee-4fc1-b134-fadf9f689e0a', '3453e8b9-2f28-4ee9-a1f6-493e72fc0930', 'Viên', 1, true, 350, 500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('584974ca-8098-4b01-a5d2-4a786000d46d', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001060', '8850769013801', 'Eugica Xanh', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('4599067d-a302-4eb0-abd3-aa78ca7b3918', '584974ca-8098-4b01-a5d2-4a786000d46d', 'Viên', 1, true, 622, 800);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('8947864a-f829-410b-9381-c94f8e53aaa1', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001057', '8936085360383', 'Celecoxib 200', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('ccd8cb01-7c56-4289-947f-1a901289a7d5', '8947864a-f829-410b-9381-c94f8e53aaa1', 'Viên', 1, true, 800, 2000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('c864a9fa-f436-4887-a92f-5a76d04a4ea3', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001054', '8935076040815', 'Prednisolone 5mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('e0ee9470-b791-47e0-9b57-18f28e3d0888', 'c864a9fa-f436-4887-a92f-5a76d04a4ea3', 'Viên', 1, true, 150, 250);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('b1a04ca4-a158-4a60-a670-8b8efb751c83', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001050', NULL, 'Ventolin XỊt', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('6b0adff7-af9c-4b66-9ba6-55b2a8527392', 'b1a04ca4-a158-4a60-a670-8b8efb751c83', 'Lọ', 1, true, 106000, 108000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('6196c17a-369b-4cc8-89c9-27553472cf67', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001044', '8934700020322', 'Piropharm 20mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('25441a0c-b403-4135-8b3f-005e77ff9b6f', '6196c17a-369b-4cc8-89c9-27553472cf67', 'Viên', 1, true, 510, 700);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('458ca570-66af-46db-8d57-be9f7fc57da2', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001041', NULL, 'Diacerein 50mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('b1ccdcdf-81ea-4985-ba2e-7255df494801', '458ca570-66af-46db-8d57-be9f7fc57da2', 'Viên', 1, true, 1000, 1500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('dc63431f-6f9e-4873-8da7-5f8f95e04add', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001038', '8936064215420', 'Baburol', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('d2b9c6c0-3bc4-4587-9ecb-2dd7af448941', 'dc63431f-6f9e-4873-8da7-5f8f95e04add', 'Viên', 1, true, 800, 1100);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('dd41d322-eb1c-44ea-8ec3-cfd8150b2c4a', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001035', '8934690110119', 'Waisan', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('8ce60a8f-0efb-41a4-9990-4bddd621c516', 'dd41d322-eb1c-44ea-8ec3-cfd8150b2c4a', 'Viên', 1, true, 800, 1500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('46c4447c-b512-45f9-96d2-22f3bd0c6daa', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001032', '8934690011577', 'Bidivon', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('c3fd8eb6-e2dc-4c47-9c4d-08c0897163a7', '46c4447c-b512-45f9-96d2-22f3bd0c6daa', 'Viên', 1, true, 457, 600);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('6ad4ed88-5df1-4077-a9e1-5025c4021e16', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001026', '8936022471172', 'Alaxan', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('41e33fb9-7317-4f86-939e-7cad22c82cd2', '6ad4ed88-5df1-4077-a9e1-5025c4021e16', 'Viên', 1, true, 1140, 1300);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('321edf53-e8ba-4752-85cb-915f85a20c94', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001023', '8902399002561', 'Meloxicam 7,5 mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('f368ca43-2e8b-487a-84c4-cfc5f99bd36e', '321edf53-e8ba-4752-85cb-915f85a20c94', 'Viên', 1, true, 150, 350);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('b122e132-dbaa-46aa-b857-48765ef1f6e7', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001019', 'PAA177600', 'Medrol 16mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('7561bfaa-6c2b-4cb5-a6af-d5d8f017f049', 'b122e132-dbaa-46aa-b857-48765ef1f6e7', 'Viên', 1, true, 3700, 4000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('2279c0d2-3582-4e1d-9b10-1263d9e3b24e', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001016', '8850769013818', 'Eugica Fort', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('02aa3e2d-165e-46da-80d9-0ddda0850df8', '2279c0d2-3582-4e1d-9b10-1263d9e3b24e', 'Viên', 1, true, 839, 900);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('519af7cc-622c-4ecf-8633-c19e3443cc9e', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001015', NULL, 'Berodual', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('bf2ea31f-c2a7-4e97-81ce-24e2276a4b81', '519af7cc-622c-4ecf-8633-c19e3443cc9e', 'Bình', 1, true, 145000, 150000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('8c200c55-97de-4507-bec6-6173778f431e', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001013', '8902399005388', 'Cocilone 1mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('aad14fba-a814-4a62-bbd6-170cf4e58c48', '8c200c55-97de-4507-bec6-6173778f431e', 'Viên', 1, true, 1208, 1500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('6fb30210-e7ba-44e5-8ee7-faa48b635682', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001012', '8902399005937', 'Fimaconazole 150mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('d8f3ce7d-5bf4-4ac3-959a-c9ca31f8ef73', '6fb30210-e7ba-44e5-8ee7-faa48b635682', 'Viên', 1, true, 4000, 10000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('4f082a82-af52-46ca-a4c5-42c406659a87', 'c4ec852b-1bee-40b4-8477-431921cc8073', '00000000', '8934574082358', 'Itraconazol 100mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('225536ce-994f-4b37-a9ee-1a27978931c0', '4f082a82-af52-46ca-a4c5-42c406659a87', 'Viên', 1, true, 5333, 7000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('43bce64e-7c1f-411c-b263-5f6791be3c62', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001006', '8936010461413', 'Cetirizin 10mg Đỏ', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('e4547e57-2bb8-4d40-9ff8-f40b495ec115', '43bce64e-7c1f-411c-b263-5f6791be3c62', 'Viên', 1, true, 350, 500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('b2449531-f6bd-49e4-9542-0bfe2a9c78ed', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001003', NULL, 'Acyclovir 800mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('9981158f-6831-4f9a-b732-fb906d0f3786', 'b2449531-f6bd-49e4-9542-0bfe2a9c78ed', 'Viên', 1, true, 2264, 3500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('3ad6e4dc-eb10-448b-9dc4-5b0060dc198f', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP001000', '8936024390983', 'Ketosan 1mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('132e7d1c-7816-4110-9cac-b40874f94896', '3ad6e4dc-eb10-448b-9dc4-5b0060dc198f', 'Viên', 1, true, 730, 1000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('7bc9129b-6972-412f-9e85-2d944d3b6cce', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP000999', '8936040627018', 'Eucaphor Trường Thọ', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('0505ac51-f251-4c73-b0c9-995de779c045', '7bc9129b-6972-412f-9e85-2d944d3b6cce', 'Lọ', 1, true, 14400, 18000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('bd19a0ee-be69-4ad8-9722-ce8f20fb4b3d', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP000998', '8935092203164', 'Siro Ho Ích Nhi', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('38606601-c9cc-4181-8aad-79f9353c2410', 'bd19a0ee-be69-4ad8-9722-ce8f20fb4b3d', 'Chai', 1, true, 65000, 70000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('dbe21184-6724-4b51-af83-055ad0a3b5cf', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP000996', '8936058822894', 'Siro Bổ Phế', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('8ac5b5c8-6938-4e31-a576-5dc56709ab24', 'dbe21184-6724-4b51-af83-055ad0a3b5cf', 'Chai', 1, true, 40000, 50000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('8e500647-adef-4f25-803e-af50431fce46', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP000991', '8936099625461', 'Xịt Họng Keo Ong Hamico', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('dade4a81-1076-48d7-a131-16550d2838d9', '8e500647-adef-4f25-803e-af50431fce46', 'Chai', 1, true, 38000, 50000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('80f6ccfb-99c0-4aa4-be88-6cd6f6e0fc25', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP000990', '8938540796430', 'Siro Cao Lá Thường Xuân', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('d6972c85-f33e-4b76-8320-55fead164b81', '80f6ccfb-99c0-4aa4-be88-6cd6f6e0fc25', 'Chai', 1, true, 52000, 70000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('2448ac3f-1339-4dcc-8880-b27f9548bd28', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000984', '8934700031618', 'Mexcold 500mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('73f9a18b-a716-4b96-94d6-f046a83fefdc', '2448ac3f-1339-4dcc-8880-b27f9548bd28', 'Viên', 1, true, 507, 700);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('ec642309-e899-4ffb-8154-48cd2521c59f', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000983', '8934567002851', 'Ho Astex', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('7f4bded8-9c46-40e7-80ef-04cb7afe0cab', 'ec642309-e899-4ffb-8154-48cd2521c59f', 'Chai', 1, true, 44000, 48000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('049cf8e3-4c9d-4831-be58-447008fb01e2', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000980', '8935131204152', 'Alverin-40mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('6a319231-eb5a-49e8-afef-4c8d277a1178', '049cf8e3-4c9d-4831-be58-447008fb01e2', 'Viên', 1, true, 310, 500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('79a78ea2-2500-4c12-a5ae-3dd6df94229a', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000977', NULL, 'Flexidron 90mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('5b276a86-6d51-4554-ac99-8ee5a6801900', '79a78ea2-2500-4c12-a5ae-3dd6df94229a', 'Viên', 1, true, 4780, 5500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('b0a964c7-09ea-49aa-8457-6eb2b3c2aada', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000974', '8936116252502', 'Menpeptine', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('936d0892-254c-4ccc-8d08-6f6af8c8c315', 'b0a964c7-09ea-49aa-8457-6eb2b3c2aada', 'Viên', 1, true, 1920, 2500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('9b8bfc9c-d2a5-411c-be6a-1fae85018fbd', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000971', '5000158068162', 'Gaviscon', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('668d0fbb-6161-4e12-b2f9-0c04fbf49f82', '9b8bfc9c-d2a5-411c-be6a-1fae85018fbd', 'Gói', 1, true, 6275, 8000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('94124df5-e233-461c-b7f5-5848868a9688', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000968', '8936134271745', 'Rebastric 100mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('84c6088a-c986-44ae-9937-2d2e4266c4a9', '94124df5-e233-461c-b7f5-5848868a9688', 'Viên', 1, true, 1866, 2500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('7f975625-f4ef-4be7-9006-4ccdbd9282bd', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000965', NULL, 'Esomeprazol 20mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('9bbdfe19-6fec-4b35-b0f2-8aa96bcb96de', '7f975625-f4ef-4be7-9006-4ccdbd9282bd', 'Viên', 1, true, 740, 2000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('94dd8e96-ab4b-4fc2-abbb-61f6c796529f', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000962', '8935076035118', 'Trimebutin 100mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('a66b6858-673b-4698-8a9e-35f571d4410a', '94dd8e96-ab4b-4fc2-abbb-61f6c796529f', 'Viên', 1, true, 750, 1500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('073ddf05-b64e-4706-ac5e-0fb35674b36d', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000958', '8936022470045', 'Atussin', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('0378233e-7397-4636-b330-e207d44ed7ef', '073ddf05-b64e-4706-ac5e-0fb35674b36d', 'Chai', 1, true, 25000, 28000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('7f98505f-c3ed-4218-a3a0-385d053ff936', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000952', NULL, 'Motilium-M', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('c8f5204f-8559-4147-aded-1c39aa5d3282', '7f98505f-c3ed-4218-a3a0-385d053ff936', 'Viên', 1, true, 2170, 2500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('8ff8f31f-cfd7-46ad-9fcc-58cf713d0b5b', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000950', '4104480705670', 'Siro Prospan', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('2924a3ea-88d9-465b-8191-7bd9de41a6cc', '8ff8f31f-cfd7-46ad-9fcc-58cf713d0b5b', 'Chai', 1, true, 87000, 90000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('bab98d2c-8902-4713-a040-c28edbbb9ddb', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000947', NULL, 'Neo-Godian', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('cb8cd16f-d436-4448-a7d8-9e7c9d2272f6', 'bab98d2c-8902-4713-a040-c28edbbb9ddb', 'Viên', 1, true, 400, 600);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('c2ed54a3-93fb-45e7-ae90-bd1bc9bca110', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000944', '8936022471318', 'Kremil-S', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('1035c60a-76ae-4431-ac78-82609facc045', 'c2ed54a3-93fb-45e7-ae90-bd1bc9bca110', 'Viên', 1, true, 1144, 1500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('691b8a88-7639-4c18-8578-6ee6c2e3b14f', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000942', NULL, 'Panadol Việt Nam', true, 'f3626e87-aa48-4356-bb99-aeb36029ed3c', 'Việt Nam');
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('0f54e7ff-510b-4386-a07e-9955cd0fe321', '691b8a88-7639-4c18-8578-6ee6c2e3b14f', 'Viên', 1, true, 540, 833);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('7ee6eccc-adeb-443b-ad85-7dab7ffa487e', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000933', '8936022470182', 'Dolfenal 500mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('62852ff7-c0a3-4fa6-8d94-8eaf09e3a1e4', '7ee6eccc-adeb-443b-ad85-7dab7ffa487e', 'Viên', 1, true, 1376.32, 2000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('f190daf4-9569-43d7-8f52-da2bcce6c4dd', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000928', NULL, 'Paralmax 500mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('69c199a1-4be6-422b-90bf-9d9b1389e379', 'f190daf4-9569-43d7-8f52-da2bcce6c4dd', 'Viên', 1, true, 1500, 2500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('07be3f55-95bb-427f-be80-7559ad528376', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000925', NULL, 'Diclofenac 75mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('f68e34ba-3f4a-4d50-a7be-7e88b16a2ad1', '07be3f55-95bb-427f-be80-7559ad528376', 'Viên', 1, true, 265, 500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('485db810-405d-4bf4-abdd-c6796a9fc215', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000922', NULL, 'Omeraz 20mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('b39dfbc5-10bd-4732-ae4d-5b03b5de927e', '485db810-405d-4bf4-abdd-c6796a9fc215', 'Viên', 1, true, 1365, 1500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('49efdc94-d72f-461c-a525-859358d2e7fc', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000920', '01502921', 'Efferagan 500mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('43869291-1efe-46a2-a038-d08277cf72e6', '49efdc94-d72f-461c-a525-859358d2e7fc', 'Viên', 1, true, 3000, 5000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('35cfe58c-93d9-497d-bb28-090bf65f1954', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000918', '8936123411312', 'Phosphalugel', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('d936bf98-1428-4b64-b4c7-415f2ed44209', '35cfe58c-93d9-497d-bb28-090bf65f1954', 'Gói', 1, true, 3950, 5000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('444338ad-d01e-4b45-8f3e-4f607ad5d496', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000913', '8936014420980', 'Tiffy', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('94dc32da-41d1-493e-9293-2fdc7b0d7f18', '444338ad-d01e-4b45-8f3e-4f607ad5d496', 'Viên', 1, true, 1140, 1500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('01521471-dd54-4c48-8dad-03a0a50dd50c', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000910', '8935206022261', 'Hapacol 650mg', true, '587d666e-caa9-4c8a-a037-56efd647ea06', '650mg');
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('df01c40a-2f3b-468f-89cb-a33cbf21777c', '01521471-dd54-4c48-8dad-03a0a50dd50c', 'Viên', 1, true, 552, 800);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('3d8a9842-4b14-4e9c-8fee-ccbab3be20bc', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000907', '8936018670510', 'Tiram 100mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('9bfab477-21f8-449e-bb58-6f2c253aed25', '3d8a9842-4b14-4e9c-8fee-ccbab3be20bc', 'Viên', 1, true, 990, 1500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('8ce6a7c5-436c-4532-83a6-d08f41727556', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000904', '8936144800997', 'Vacodomtium 20mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('c58a1446-21bb-43cf-8d99-cfe92f5bc52d', '8ce6a7c5-436c-4532-83a6-d08f41727556', 'Viên', 1, true, 400, 1000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d80e4bb7-1445-42d3-864e-335ae9ee0568', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000901', '8936085366538', 'Mezolax 40mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('3416aa4d-4abd-432f-af3d-f95e45f117e3', 'd80e4bb7-1445-42d3-864e-335ae9ee0568', 'Viên', 1, true, 2160, 4000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('111ab323-ca65-48e1-a56d-b9092f0a708c', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000899', '8936022471028', 'Decolgen ND', true, 'd2e01ad1-f7d8-4bb4-bc95-989b4e671dce', 'ND');
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('4d51c05e-cac7-49a0-982b-b001ec202e6a', '111ab323-ca65-48e1-a56d-b9092f0a708c', 'Viên', 1, true, 1125, 1500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('7f61985e-ff9e-4b8c-b4df-a682b5de6b55', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000896', '8935137700719', 'Cetecoleceti 40mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('b90a6397-0048-4502-a0b1-593096e10ac0', '7f61985e-ff9e-4b8c-b4df-a682b5de6b55', 'Viên', 1, true, 1000, 2000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d7783676-0b78-4ff3-85dd-088c8b367888', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP000893', '8936024920746', 'Bông tâm đầu lớn', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('72c61993-c21c-4e72-89ef-2c02a053824a', 'd7783676-0b78-4ff3-85dd-088c8b367888', 'Gói', 1, true, 4000, 5000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('38bac19d-cad8-4fce-8ef4-5da2f91a4e0a', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP000892', NULL, 'Gạc y tế lớn', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('582201d2-ea43-4e94-88f5-79db67a39eb5', '38bac19d-cad8-4fce-8ef4-5da2f91a4e0a', 'Gói', 1, true, 5840, 10000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('04c7b7a9-8061-4b37-a6f8-fcc6ff449ea7', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP000891', NULL, 'Băng keo vải liên kết 1.25x200cm', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('3ce341cb-f5e4-401f-a310-1afe12db6d94', '04c7b7a9-8061-4b37-a6f8-fcc6ff449ea7', 'Cuộn', 1, true, 1901, 3000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('96833c56-7c61-4b1c-b814-809a5846f25b', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP000890', NULL, 'Băng thun mỏng', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('b3a43b49-0aa8-4700-b971-be3fff9682b8', '96833c56-7c61-4b1c-b814-809a5846f25b', 'Cuộn', 1, true, 1500, 3000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('fc1f86b5-f9eb-408e-ae76-50b20d479d62', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP000889', NULL, 'Gạc y tế nhỏ', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('23faa987-e377-4847-bb1e-31e40471e1de', 'fc1f86b5-f9eb-408e-ae76-50b20d479d62', 'Gói', 1, true, 0, 5000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('e7c0d47f-e4a9-4df3-8964-2da5eda120d1', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP000888', '8936024920326', 'Bông tâm đầu nhỏ', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('dcfa789a-4e5f-45d7-92d0-456b963d102b', 'e7c0d47f-e4a9-4df3-8964-2da5eda120d1', 'Gói', 1, true, 0, 5000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('1edfcc63-bfe6-43b6-97c3-cac0b8604195', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000887', NULL, 'New Choice', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('f3631b78-b409-49e2-ade9-90b67b6962e9', '1edfcc63-bfe6-43b6-97c3-cac0b8604195', 'Hộp', 1, true, 8320, 10000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('6356dc18-33e5-4565-a29e-ee01f911eddb', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP000886', NULL, 'Gỗ Đè Lưỡi', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('62dc4afb-e0b1-4e8a-ab5b-b3a1d2138428', '6356dc18-33e5-4565-a29e-ee01f911eddb', 'Que', 1, true, 25000, 300);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('3c6b75e7-9721-4bae-b7bf-d430892fb7ae', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000885', NULL, 'Marvelon', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('f9c1512d-2a89-43fd-9ced-6f3e0d3385a5', '3c6b75e7-9721-4bae-b7bf-d430892fb7ae', 'Hộp', 1, true, 82150, 85000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('92ab7b13-caa8-4672-800d-ec48bc51957d', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000884', NULL, 'Postinor-1', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('f808905d-d087-4cb2-a796-100de554b223', '92ab7b13-caa8-4672-800d-ec48bc51957d', 'Hộp', 1, true, 34000, 40000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('07af1b41-62bb-47fe-8b52-4cb5bf5f2124', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000883', '99024864', 'Drosperin', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('43a53ef5-955e-4380-900d-76869d686551', '07af1b41-62bb-47fe-8b52-4cb5bf5f2124', 'Hộp', 1, true, 155800, 160000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('0cdc43d6-4133-4ba5-9f16-e27a9a7ae8e2', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000881', NULL, 'Mercilon', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('be2ebec6-a40c-4bf8-a1f6-db9e1eb32a6d', '0cdc43d6-4133-4ba5-9f16-e27a9a7ae8e2', 'Hộp', 1, true, 83000, 92000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('274835f9-0662-4455-ba15-ee3c7f5ce3c4', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000880', '8437019299392', 'Rosepire', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('6d0926da-d529-4013-acd1-badcaa07ca63', '274835f9-0662-4455-ba15-ee3c7f5ce3c4', 'Hộp', 1, true, 121700, 135000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('6e7310c1-9e6a-446c-bca9-1bbf11fdf2c9', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP000879', NULL, 'Nhiệt kế lilika', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('44a209f5-79d6-49da-8d44-10a16ca506a9', '6e7310c1-9e6a-446c-bca9-1bbf11fdf2c9', 'Cái', 1, true, 18225, 30000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('1a0cf4ab-b01c-4f66-bd2f-783c4cad4c4e', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000878', NULL, 'Diane-35', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('07209172-2709-4868-a962-429910c4e2ff', '1a0cf4ab-b01c-4f66-bd2f-783c4cad4c4e', 'Hộp', 1, true, 135500, 140000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('26a34461-d227-4aee-8f6f-0d22d0d402a5', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000874', '8935286500321', 'Thuốc Ngừa Thai Khẩn Cấp', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('21c94839-751c-455b-98ee-1cfa771e265e', '26a34461-d227-4aee-8f6f-0d22d0d402a5', 'Viên', 1, true, 5100, 10000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('b38d3c7f-4b16-41a7-a513-6d5a58d7a670', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP000870', '8938507697503', 'Gel Bôi Trơn Rocmen', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('cbe41360-4c64-432f-8211-060326c034eb', 'b38d3c7f-4b16-41a7-a513-6d5a58d7a670', 'Hộp', 1, true, 25800, 50000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('f2ebaffc-9b6e-49e9-86cc-9faabdcf68d8', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP000869', '8938554952143', 'Que Thử Thai Baby', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('ee536293-66ab-40c1-ac26-875dad18cbc6', 'f2ebaffc-9b6e-49e9-86cc-9faabdcf68d8', 'Hộp', 1, true, 8000, 15000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('9750fd4d-28af-450a-9347-85e5601e133d', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP000866', '8938521053019', 'Bom tiem 1CC', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('cb5e10d6-d233-4d18-976f-07234cd320c0', '9750fd4d-28af-450a-9347-85e5601e133d', 'Cái', 1, true, 710, 1000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('2d01ed08-59be-4c03-a927-bb345aa515cb', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP000865', '8938507697022', 'Bao Cao Su Hoa Hồng Lớn', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('4db264e9-f9fc-4c09-a1a8-ea1dded6c041', '2d01ed08-59be-4c03-a927-bb345aa515cb', 'Hộp', 1, true, 8000, 20000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('584af2c9-6649-4da4-b8e5-3c5a5507fb19', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP000863', '8936096450011', 'Bao Cao Su Ok', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('d34b2736-fe47-44c7-beb2-a14e2e29ca9f', '584af2c9-6649-4da4-b8e5-3c5a5507fb19', 'Hộp', 1, true, 3500, 10000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('5c8fdcc8-8a09-496c-9aa9-43001418c87c', '80b8c40b-e414-4042-87ef-8ed5adff3c81', 'SP000861', NULL, 'Salonsip', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('5d13dd2b-205a-479c-ad2d-682ad1a77fb4', '5c8fdcc8-8a09-496c-9aa9-43001418c87c', 'Gói', 1, true, 29000, 34000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('ddcab115-262b-4814-aa4f-70ad2d13bae3', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000858', '8936098968033', 'Vnp Nhiệt miệng', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('e158c547-d6a0-49ac-b6c4-6c6221707996', 'ddcab115-262b-4814-aa4f-70ad2d13bae3', 'Tuýp', 1, true, 20000, 25000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('c123eb5f-f105-41fa-b6fd-b2211c488e6d', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000857', '8936218612259', 'Gel Bôi Niêm Mạc Lafori', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('33d675b6-aedf-4459-aae4-524f690e7852', 'c123eb5f-f105-41fa-b6fd-b2211c488e6d', 'Tuýp', 1, true, 30000, 40000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('e033dba0-1580-45e9-be89-430e232263ad', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000856', '8936027006348', 'Fendexi Forte 10g', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('e0f0d3b7-3b7f-431e-9db2-3fdfe8819a1d', 'e033dba0-1580-45e9-be89-430e232263ad', 'Tuýp', 1, true, 39300, 50000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('bccd6e62-44dd-44c1-91e5-0274915a0792', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000855', NULL, 'Bactronil mupirocin 2%', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('8609198a-32f2-4c73-8c03-6015072e59b9', 'bccd6e62-44dd-44c1-91e5-0274915a0792', 'Tuýp', 1, true, 32000, 35000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('0071f775-326a-4251-988f-80fe8212fcbf', '80b8c40b-e414-4042-87ef-8ed5adff3c81', 'SP000854', '8936064217820', 'Dau gio kim Agi', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('9f82feba-5170-4488-9732-bad4041bfe67', '0071f775-326a-4251-988f-80fe8212fcbf', 'Chai', 1, true, 0, 25000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('9457c11f-8054-4986-85f6-a91d35a2ec9d', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000853', NULL, 'Silkron cream', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('cdc4e564-ebb8-43bc-ba13-d67e7003e529', '9457c11f-8054-4986-85f6-a91d35a2ec9d', 'Tuýp', 1, true, 19300, 22000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('1b1d418c-ecc4-4a9e-990d-1ee8cd5ee217', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000852', '8936027000995', 'Gentridecme Cream', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('494b398f-8f92-4fe1-9b31-4b1f0d9077a9', '1b1d418c-ecc4-4a9e-990d-1ee8cd5ee217', 'Tuýp', 1, true, 14300, 17000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('77194e8d-1cc0-4795-a1b3-d6bc6b0b98cf', '80b8c40b-e414-4042-87ef-8ed5adff3c81', 'SP000851', NULL, 'Erythromycin & nghệ medipharco', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('db7426ba-2bcc-448b-b1c2-1813c4958fff', '77194e8d-1cc0-4795-a1b3-d6bc6b0b98cf', 'Tuýp', 1, true, 0, 20000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('ebb80c09-6f31-4882-abe3-8d8160812f8b', '80b8c40b-e414-4042-87ef-8ed5adff3c81', 'SP000850', '8938503584197', 'Yoosun rau má', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('748319be-87e3-408c-8226-b2174e1e585d', 'ebb80c09-6f31-4882-abe3-8d8160812f8b', 'Tuýp', 1, true, 27000, 30000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('a2d486b0-3f7c-4b6f-90ad-774f6451d20c', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000849', NULL, 'Hepgentex', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('147ed00f-1248-4934-a686-c16d0db92ece', 'a2d486b0-3f7c-4b6f-90ad-774f6451d20c', 'Tuýp', 1, true, 35900, 38000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('53f50408-14b6-4747-ab4d-c53d78a38cee', '80b8c40b-e414-4042-87ef-8ed5adff3c81', 'SP00084800', '8938530372538', 'Baby cream sano- Nano bạc', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('622a4ccf-e9e6-4d12-a4bb-96965fc8c1a3', '53f50408-14b6-4747-ab4d-c53d78a38cee', 'Tuýp', 1, true, 50000, 75000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('20433604-5e41-46f2-a2ae-ded8f4fa3e15', '80b8c40b-e414-4042-87ef-8ed5adff3c81', 'SP000846', '4713248405358', 'Ecosip', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('c630d50f-994e-4dfb-865b-3a02c403497a', '20433604-5e41-46f2-a2ae-ded8f4fa3e15', 'Gói', 1, true, 15000, 17000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('5b962143-e259-492a-aa25-1ddcccee7983', '80b8c40b-e414-4042-87ef-8ed5adff3c81', 'SP00084', '8936097590020', 'Tinh Dầu Tràm Bé Thơ', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('d413dc84-c694-431b-bb43-1a5e58fbeeba', '5b962143-e259-492a-aa25-1ddcccee7983', 'Chai', 1, true, 44100, 60000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('cd85f730-cfa6-4c6a-b54b-52e3eb032c32', '80b8c40b-e414-4042-87ef-8ed5adff3c81', 'SP000844', '8936036961287', 'Rhomatic gel', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('9909216d-8073-43c6-8bbf-34aab127bf92', 'cd85f730-cfa6-4c6a-b54b-52e3eb032c32', 'Tuýp', 1, true, 20700, 25000);
INSERT INTO public.products (id, category_id, product_code, name, is_active, is_direct_sale) 
                        VALUES ('cea87d8f-8caf-4eff-a8fd-76754d4e0cac', '80b8c40b-e414-4042-87ef-8ed5adff3c81', 'PARENT_SALONPAS', 'Salonpas', true, false);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('02b3e032-f4c9-485b-ac17-afdd9aece4c4', '80b8c40b-e414-4042-87ef-8ed5adff3c81', 'SP000843', '8935106241113', 'Salonpas Gel', true, 'cea87d8f-8caf-4eff-a8fd-76754d4e0cac', 'Gel');
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('92e2abcd-c9e9-4855-bf59-4f2b68dfd1cb', '02b3e032-f4c9-485b-ac17-afdd9aece4c4', 'Tuýp', 1, true, 41300, 46000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('c7e1f272-059c-43a4-8392-08ccafc1b123', '80b8c40b-e414-4042-87ef-8ed5adff3c81', 'SP000840', '8934935012284', 'Cao Bạch Hổ', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('8df2c4e0-18ca-45d5-b7e5-9dae40929fa5', 'c7e1f272-059c-43a4-8392-08ccafc1b123', 'Lọ', 1, true, 24300, 30000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('a581c4a7-7c29-455e-9c92-b8afd952b4b7', '80b8c40b-e414-4042-87ef-8ed5adff3c81', 'SP000839', '8935269929835', 'Kem bôi da Trisula', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('8c1a1965-fecc-4882-abb2-e5c0a3f78b69', 'a581c4a7-7c29-455e-9c92-b8afd952b4b7', 'Tuýp', 1, true, 20000, 25000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('db4ad428-6b95-432b-9e9d-6a501fcb90ea', '80b8c40b-e414-4042-87ef-8ed5adff3c81', 'SP000838', NULL, 'Derma ultra', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('1b13c139-8471-464a-8536-58a5351c18da', 'db4ad428-6b95-432b-9e9d-6a501fcb90ea', 'Tuýp', 1, true, 40000, 120000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('510b4679-ea80-4b28-a4fd-2afd8ef459b0', '80b8c40b-e414-4042-87ef-8ed5adff3c81', 'SP000837', '8938540796546', 'Gel trị sẹo Anscar Ultra', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('47473962-3d49-4806-88e0-11ff10ee218a', '510b4679-ea80-4b28-a4fd-2afd8ef459b0', 'Tuýp', 1, true, 150000, 200000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('ef8de1a7-7c4a-45c1-b6d8-31422bca77e2', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000836', '8934940010107', 'Dibetalic', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('bf01cf2c-185e-4723-8612-a33d518b2e48', 'ef8de1a7-7c4a-45c1-b6d8-31422bca77e2', 'Tuýp', 1, true, 18000, 20000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('852ebda9-bdd4-42f6-bf8c-483ed772eec1', '80b8c40b-e414-4042-87ef-8ed5adff3c81', 'SP000835', '8934567086110', 'Dầu nóng mặt trời opc nhỏ', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('6b1eb513-ef27-487f-bbb7-423c6657b1d1', '852ebda9-bdd4-42f6-bf8c-483ed772eec1', 'Chai', 1, true, 38000, 45000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('0636ddc5-bf9a-4cd6-a23b-095b3fb1fa54', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000833', '8936085360963', 'Cadirovid', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('0dd05b70-2b42-41cd-981d-1986316752a7', '0636ddc5-bf9a-4cd6-a23b-095b3fb1fa54', 'Tuýp', 1, true, 6000, 10000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('5fbdd38c-65e8-4ad3-a6c0-900774c38c40', '80b8c40b-e414-4042-87ef-8ed5adff3c81', 'SP000832', NULL, 'Fucicort bôi', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('9f9d7e16-fbf4-43fb-bef7-83bf99a70d72', '5fbdd38c-65e8-4ad3-a6c0-900774c38c40', 'Tuýp', 1, true, 102000, 115000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('2f09e7c0-fda0-44a2-b94e-03d69657ed12', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000831', '8938523488109', 'Cronazol', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('119d620b-0d98-4e78-a1dd-f1ba8ab516be', '2f09e7c0-fda0-44a2-b94e-03d69657ed12', 'Tuýp', 1, true, 45600, 50000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('b782102f-9a0e-46dd-b696-f44205b94e13', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000830', '8936098966060', 'Bôi Clingel', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('53ca638d-7b0b-447d-b546-47e73ee08a61', 'b782102f-9a0e-46dd-b696-f44205b94e13', 'Tuýp', 1, true, 50000, 75000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('489140af-d0d1-4e51-9028-463cdad30f22', '80b8c40b-e414-4042-87ef-8ed5adff3c81', 'SP000829', NULL, 'Corti RVN', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('9991245b-7a9c-4d96-a640-b11e5f205229', '489140af-d0d1-4e51-9028-463cdad30f22', 'Chai', 1, true, 16640, 22000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('afe64fdb-7104-4fca-86d9-972a7b70e61a', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000828', '8936065621046', 'Tezkin 10g', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('4d4e2fe5-ed5d-433a-b800-4894189ec7d6', 'afe64fdb-7104-4fca-86d9-972a7b70e61a', 'Tuýp', 1, true, 21500, 30000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('519dbfc1-028a-4fb2-84f3-15458b1b2aaa', '80b8c40b-e414-4042-87ef-8ed5adff3c81', 'SP000827', '8938510417037', 'Cortibido bidopharma', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('dd8e922f-33ea-42f4-9370-2ac507d64f67', '519dbfc1-028a-4fb2-84f3-15458b1b2aaa', 'Chai', 1, true, 9000, 12000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('580fb731-3066-482f-a5d1-40c0f8b34325', '80b8c40b-e414-4042-87ef-8ed5adff3c81', 'SP000826', '8935006530935', 'Remos ib', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('9e4f6479-07fc-4aa8-b1c6-e58c70f12e67', '580fb731-3066-482f-a5d1-40c0f8b34325', 'Tuýp', 1, true, 51000, 55000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d5e246af-57c6-4135-ae1b-d9e46f9bfc46', '80b8c40b-e414-4042-87ef-8ed5adff3c81', 'SP000825', '8936027003224', 'Enoti kem', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('41e79482-35e9-4881-9364-3a17c47424e4', 'd5e246af-57c6-4135-ae1b-d9e46f9bfc46', 'Tuýp', 1, true, 20000, 25000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('2064a5f3-f767-49d9-9b47-9798d089bf33', '80b8c40b-e414-4042-87ef-8ed5adff3c81', 'SP000824', '8850109051418', 'Ống hít', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('a64c723a-d5d8-464b-95b0-3993adcb8c91', '2064a5f3-f767-49d9-9b47-9798d089bf33', 'Ống', 1, true, 9680, 12000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('40a58377-eafd-4e3c-8699-f232006e9b1a', '80b8c40b-e414-4042-87ef-8ed5adff3c81', 'SP000821', NULL, 'Dầu nóng Trường Sơn', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('7251a2e4-b6c6-407e-9180-c3795830dac8', '40a58377-eafd-4e3c-8699-f232006e9b1a', 'Chai', 1, true, 25000, 30000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('9ea9ec82-e16a-4172-b2f9-837e2261f80f', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000820', '8938501089670', 'Sihiron', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('efb7a76d-002e-47dd-9dbe-acc279904708', '9ea9ec82-e16a-4172-b2f9-837e2261f80f', 'Tuýp', 1, true, 6050, 10000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('3aba4e3d-afa1-479c-ba58-d5b9917ef0eb', '80b8c40b-e414-4042-87ef-8ed5adff3c81', 'SP000819', '8938505132143', 'Dầu phật linh 5ml lớn', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('dd613ecc-5172-4ea3-9b06-7e198022ccab', '3aba4e3d-afa1-479c-ba58-d5b9917ef0eb', 'Chai', 1, true, 16450, 19000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('6889475b-e375-4da6-a53d-b872152d4e51', '80b8c40b-e414-4042-87ef-8ed5adff3c81', 'SP000818', '8934567001557', 'Dầu nóng mặt trời opc lớn', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('0ee1f826-8db9-49de-8f83-4522aefc4eba', '6889475b-e375-4da6-a53d-b872152d4e51', 'Chai', 1, true, 62300, 67000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('b08e7c36-3354-4d99-94f4-56acd235a49a', '80b8c40b-e414-4042-87ef-8ed5adff3c81', 'SP000817', '8936018670152', 'Antanazol', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('9239b824-7a55-45fd-a818-8e84a1d0f3a4', 'b08e7c36-3354-4d99-94f4-56acd235a49a', 'Tuýp', 1, true, 9000, 20000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('cb453677-7f64-4af7-b108-c6472a4c5380', '80b8c40b-e414-4042-87ef-8ed5adff3c81', 'SP000816', NULL, 'Bosgyno', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('543a7239-6b7f-423c-9a30-2a2abce8ddf8', 'cb453677-7f64-4af7-b108-c6472a4c5380', 'Tuýp', 1, true, 11900, 15000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d986bb92-9f70-477f-ad98-52dcb56750ef', '80b8c40b-e414-4042-87ef-8ed5adff3c81', 'SP000815', '8936018670169', 'Gentri-sone', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('f91a2ceb-617f-46b1-b777-8b6d6a31a030', 'd986bb92-9f70-477f-ad98-52dcb56750ef', 'Tuýp', 1, true, 13500, 17000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('49467e1b-bd68-439e-8146-4791781342e3', '80b8c40b-e414-4042-87ef-8ed5adff3c81', 'SP000814', '8936007201077', 'Dầu gừng Thái Dương 24ml', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('6b7e8df3-fd99-4720-913b-a74ca5c3b76e', '49467e1b-bd68-439e-8146-4791781342e3', 'Chai', 1, true, 70200, 80000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('78142da0-2c0d-4fc1-9ed1-841c28d41fa4', '80b8c40b-e414-4042-87ef-8ed5adff3c81', 'SP000812', '8934574200042', 'Dầu khuynh diệp mekophar', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('8e4be3db-4d2b-4f30-9718-42e01f6e3b93', '78142da0-2c0d-4fc1-9ed1-841c28d41fa4', 'Chai', 1, true, 56100, 65000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('492ddb88-9c25-49d2-bf2a-be59659f796c', '80b8c40b-e414-4042-87ef-8ed5adff3c81', 'SP000811', '8934567003483', 'Dầu khuynh diệp opc 25ml', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('8bc5cdcd-57dd-43ed-9207-64e3935bcd0c', '492ddb88-9c25-49d2-bf2a-be59659f796c', 'Chai', 1, true, 72700, 78000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('fca4653e-3fc0-48ba-bdc6-05a45cf9971c', '80b8c40b-e414-4042-87ef-8ed5adff3c81', 'SP000810', '8938505132037', 'Dầu Gió Trường Sơn', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('f42d46df-b4a7-4c2e-a459-5dee32923916', 'fca4653e-3fc0-48ba-bdc6-05a45cf9971c', 'Chai', 1, true, 8000, 15000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('485b14e6-efbb-4aef-b37b-7fe4b8ecfbc7', '80b8c40b-e414-4042-87ef-8ed5adff3c81', 'SP000809', '8888951886124', 'Dầu Eagle brand medicated oil Trắng', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('e77a19ca-4539-47ec-b6df-2699a722d72f', '485b14e6-efbb-4aef-b37b-7fe4b8ecfbc7', 'Chai', 1, true, 105000, 120000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('8990dfcb-370b-4901-9863-40bc8531a029', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP000807', '8936178750244', 'Vitamin 3B', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('0984bd9c-5f5f-4be6-b405-c28b7300b7c3', '8990dfcb-370b-4901-9863-40bc8531a029', 'Viên', 1, true, 400, 1000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('05102e50-a34b-407b-816a-fff5516ad26d', '9e29a9dd-cf18-48f5-b0c8-610b9d52910b', 'SP000804', '8935069601061', 'Thuốc mỡ tetracyclin 1%', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('91c398bb-d1c0-4183-a072-8e866bc24ff4', '05102e50-a34b-407b-816a-fff5516ad26d', 'Tuýp', 1, true, 4530, 8000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('565b6c0a-bf35-41f3-aae6-d7cdd08ddaca', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000803', '8936098962437', 'Ketofen-drop 5ml', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('5ab3ee91-bd19-4041-a922-9ca70033e5a0', '565b6c0a-bf35-41f3-aae6-d7cdd08ddaca', 'Chai', 1, true, 30000, 40000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('639fec1c-81f2-4246-8e27-acad3ce3547d', 'b96408e2-de7a-4f65-b5f7-72b5bfd47d9f', 'SP000802', NULL, 'Refresh Tears', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('3ee1756d-55b3-4aa3-976f-74411f775af0', '639fec1c-81f2-4246-8e27-acad3ce3547d', 'Chai', 1, true, 79000, 82000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('c1c3a7d1-16ae-4d09-9ba9-336b6f17e58c', 'b96408e2-de7a-4f65-b5f7-72b5bfd47d9f', 'SP000800', '4987084556165', 'Sanlein 0,1%', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('965581bd-c6c8-4848-b3fc-dac65f238eee', 'c1c3a7d1-16ae-4d09-9ba9-336b6f17e58c', 'Chai', 1, true, 64300, 70000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('466bf885-26ea-41d3-a8cc-de25711ddcbe', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000798', '8936034560437', 'Osla 15ml', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('ff5a2746-1038-4cf6-ba36-399c482f3bb3', '466bf885-26ea-41d3-a8cc-de25711ddcbe', 'Chai', 1, true, 20700, 23000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('89fbbe94-c687-4f14-9c4d-1d1394456b09', 'b96408e2-de7a-4f65-b5f7-72b5bfd47d9f', 'SP000796', '4987084559166', 'Flumetholon 0.1%', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('17334386-3c1b-4f11-88cf-695f3b07efac', '89fbbe94-c687-4f14-9c4d-1d1394456b09', 'Chai', 1, true, 33200, 37000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d87a9913-f7bc-4962-aae8-aeb79fae8355', 'b96408e2-de7a-4f65-b5f7-72b5bfd47d9f', 'SP000795', '8936058823334', 'Eskar tears', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('5ca04c0c-61f1-4054-8309-610abce376fe', 'd87a9913-f7bc-4962-aae8-aeb79fae8355', 'Chai', 1, true, 26100, 40000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('33328b06-a7ed-4ad5-abc6-6272d18deb09', 'b96408e2-de7a-4f65-b5f7-72b5bfd47d9f', 'SP000794', '8936058820166', 'Estobra 0.3%', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('f510b4ac-a4a3-4b70-ba37-28d7de378621', '33328b06-a7ed-4ad5-abc6-6272d18deb09', 'Chai', 1, true, 11700, 15000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('f3ef2c98-7aa9-4a06-becb-94c34c34bfbb', 'b96408e2-de7a-4f65-b5f7-72b5bfd47d9f', 'SP000793', '8934690011485', 'Eyetamin', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('4b69708d-75b4-4b37-a353-871bff7b3bca', 'f3ef2c98-7aa9-4a06-becb-94c34c34bfbb', 'Chai', 1, true, 18500, 22000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d9790e31-d929-4739-a409-0cfd9f836a51', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP000791', '8936123411329', 'Pharmaton energy', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('b6a5ed73-bd49-486e-9ccb-e8fbe93881ec', 'd9790e31-d929-4739-a409-0cfd9f836a51', 'Viên', 1, true, 0, 8000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('e55c326d-9785-4fd7-96cf-f162d2752ef3', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP0007890', '8935131204831', 'Rutin C', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('8192ff0a-bac2-40a8-940a-2a638de21618', 'e55c326d-9785-4fd7-96cf-f162d2752ef3', 'viên', 1, true, 3300, 500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('93c55631-89c0-4452-93d9-3821a7220010', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP000787', '8936116250539', 'Calci D3-mdp 5K', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('86d35d98-7b7c-45b6-bc42-a89d887646a3', '93c55631-89c0-4452-93d9-3821a7220010', 'Viên', 1, true, 0, 500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('35f7879d-5d62-4aca-a1eb-fb8fee99fcd1', 'b96408e2-de7a-4f65-b5f7-72b5bfd47d9f', 'SP000786', NULL, 'Sancoba', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('a14b6a9f-3e5c-4420-91bc-ba714200438e', '35f7879d-5d62-4aca-a1eb-fb8fee99fcd1', 'Chai', 1, true, 59700, 65000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('cd9a3357-2f2c-427a-8e9b-acccd63e5972', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000785', NULL, 'Thuốc nhỏ mắt posod', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('c49b2b40-e9c4-4f33-8721-d99b34608759', 'cd9a3357-2f2c-427a-8e9b-acccd63e5972', 'Chai', 1, true, 0, 45000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('c0e9672e-36e3-45d4-b8f8-7828c8e19525', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP000783', '8936206260264', 'Viên giấp cá Thông Tọa', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('2e576248-5bfd-4b10-9cda-827af2787053', 'c0e9672e-36e3-45d4-b8f8-7828c8e19525', 'Vỉ', 1, true, 0, 35000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('04063503-4342-4570-a7cd-a49312a73709', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP000781', '8938528512090', 'Calci 50k vỉ', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('33cf25ba-1335-4183-8aee-5909337dd448', '04063503-4342-4570-a7cd-a49312a73709', 'Vỉ', 1, true, 0, 50000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('2cf836d0-9cac-4314-899c-a478e5567baa', '80b8c40b-e414-4042-87ef-8ed5adff3c81', 'SP000780', '8936034560505', 'Xisat Hồng', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('c0cb39eb-4866-427f-8547-a2cbc496e432', '2cf836d0-9cac-4314-899c-a478e5567baa', 'Chai', 1, true, 30000, 32000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('2ce40b30-3442-4924-a77a-47be125ffc55', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000779', '8936058823006', 'Neo beta lọ 8ml', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('ef5cf12f-55d3-4999-abbf-3ef5bedea9bc', '2ce40b30-3442-4924-a77a-47be125ffc55', 'Chai', 1, true, 0, 25000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d416bf7f-82e8-45a3-8dac-b9aa8a822881', '80b8c40b-e414-4042-87ef-8ed5adff3c81', 'SP000778', '8936034560512', 'Xisat daily 75ml', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('46749d93-af84-42c0-9f13-42171dfd8427', 'd416bf7f-82e8-45a3-8dac-b9aa8a822881', 'Chai', 1, true, 28180, 32000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('ead07987-6131-4e4d-af1e-abbe968be201', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000777', '8936058820111', 'Thuốc nhỏ mắt pandex Dk Pharma điều trị viêm mắt', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('9f4c2e83-abee-43f8-ba6f-5a4c7d22b940', 'ead07987-6131-4e4d-af1e-abbe968be201', 'Chai', 1, true, 0, 25000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('e765d09d-6592-4262-bae6-eeb956d5498b', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000776', NULL, 'Polydeson', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('7c1502a5-6318-4fc5-ae33-fbdc9aa38604', 'e765d09d-6592-4262-bae6-eeb956d5498b', 'Chai', 1, true, 0, 10000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('be2fdf30-672a-4938-9099-60736b887fcb', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000774', NULL, 'Vinpharton', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('358796dd-a820-42f2-9446-a4ed0b436fab', 'be2fdf30-672a-4938-9099-60736b887fcb', 'Viên', 1, true, 0, 5000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('dc883372-f793-4a29-b70b-abdff64a085a', 'b96408e2-de7a-4f65-b5f7-72b5bfd47d9f', 'SP000773', '01635815', 'TobraDex', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('3c5edeb2-8b48-447f-8b4f-04c777608e6e', 'dc883372-f793-4a29-b70b-abdff64a085a', 'Chai', 1, true, 53000, 55000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('f188dfa8-5a24-4a53-b801-05e44e320940', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000772', '8938554952037', 'Dung dịch xịt mũi Xylopisy', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('67b5bd14-f209-4243-a3f9-bafd0e4cbb82', 'f188dfa8-5a24-4a53-b801-05e44e320940', 'Chai', 1, true, 0, 50000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('e320dd84-1265-44a4-a69b-5df0d0ff8f64', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000768', NULL, 'Calci sủi Boston 500mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('92507147-fa8a-4d1e-8dbf-0abbfc9067dd', 'e320dd84-1265-44a4-a69b-5df0d0ff8f64', 'Viên', 1, true, 3000, 4000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('682d9f3a-621d-443e-a5eb-408a06ed9afb', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP000765', '8936116251277', 'Biotin mdp', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('fde5f5f6-b523-4b38-a06b-90c49869d273', '682d9f3a-621d-443e-a5eb-408a06ed9afb', 'Viên', 1, true, 0, 1500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('83c25f9a-2c25-458f-aae4-04dbebe6a125', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000764', '8936034560925', 'Mepoly merap', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('31c66cc7-f18b-4114-9ba7-9faca7650680', '83c25f9a-2c25-458f-aae4-04dbebe6a125', 'Chai', 1, true, 37100, 42000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d2286cea-edae-4e1c-9d8c-f4f288fe301a', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000761', '8934903004112', 'Otilin', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('0f906b8e-6345-4188-ba40-90ffac1fe573', 'd2286cea-edae-4e1c-9d8c-f4f288fe301a', 'Chai', 1, true, 0, 8000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('9e9b1e1e-27d2-43d7-a061-9b4fdcd85dd8', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000760', '99123970', 'Systane ultra chai lớn', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('1079abb5-c214-4434-92b6-7ef89b898b5a', '9e9b1e1e-27d2-43d7-a061-9b4fdcd85dd8', 'Chai', 1, true, 105800, 110000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d2da56a5-0471-4841-9ae1-5e5bec4c509d', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP000758', '8936014583326', 'Becoron-C', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('e7630d0a-28c5-404b-8fa8-f2d4a6f19320', 'd2da56a5-0471-4841-9ae1-5e5bec4c509d', 'Viên', 1, true, 0, 2000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('5c42bc26-14f0-47e8-bbb8-3826b56bd4ef', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000757', '8934589000330', 'Rhinex 0.05 %', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('ddedf920-72ae-4638-adbe-fa6e63c47989', '5c42bc26-14f0-47e8-bbb8-3826b56bd4ef', 'Chai', 1, true, 0, 8000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('8ef2a50e-4813-4ddb-b873-bb61031a74fc', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000756', '8935006510074', 'V.rohto New', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('1203f1c0-7511-4293-aaa3-5031f71c01ce', '8ef2a50e-4813-4ddb-b873-bb61031a74fc', 'Chai', 1, true, 52400, 55000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('7e790c70-45cc-44b8-8162-ae3f1a784ce5', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP000754', '8938550446172', 'Hotamin gineng viphar', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('c7f5e04b-b882-459f-8e44-369aebc3f9ab', '7e790c70-45cc-44b8-8162-ae3f1a784ce5', 'Vỉ', 1, true, 0, 5000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('c138c9e8-a5b8-4292-b1fc-e291f51e22f4', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000753', '8936034561007', 'Thuốc xịt mũi benita', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('1b73a618-5f36-4d34-8537-b54af2971b64', 'c138c9e8-a5b8-4292-b1fc-e291f51e22f4', 'Chai', 1, true, 91000, 95000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('f3dedd1f-09d6-4724-bf1d-539028169bef', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000751', NULL, 'Systane ultra', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('66dd5f44-0d70-48d5-9711-4e330bc4a149', 'f3dedd1f-09d6-4724-bf1d-539028169bef', 'Chai', 1, true, 0, 70000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('6c99e4f6-70be-4fb4-a608-aa1f1cba8c49', 'b96408e2-de7a-4f65-b5f7-72b5bfd47d9f', 'SP000750', '8936034560932', 'Thuốc nhỏ mắt syseye', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('035d1e23-0279-4e83-9577-b7777c7e98b3', '6c99e4f6-70be-4fb4-a608-aa1f1cba8c49', 'Chai', 1, true, 26900, 30000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d317c5e5-4619-45df-8ee7-c8db51a784d5', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP0007480', '3846846832', 'Viên ích mẫu', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('d7af1361-9153-4215-b177-369c912d4c93', 'd317c5e5-4619-45df-8ee7-c8db51a784d5', 'Viên', 1, true, 10000, 1000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('e9d182e3-e8ce-4c00-96d6-43c753941c69', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP000745', '8992772363068', 'Sensa Cool', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('2db0c573-0774-46c0-a182-fda57f9f946f', 'e9d182e3-e8ce-4c00-96d6-43c753941c69', 'Gói', 1, true, 3743, 4500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('adef2e2b-cb2d-4b8b-bc0d-cbd5fc167cfd', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP000741', '8938509942236', 'Viên nghệ đen vhoney 150g', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('b8dbb624-1777-423d-a38f-c4030f819853', 'adef2e2b-cb2d-4b8b-bc0d-cbd5fc167cfd', 'Lọ', 1, true, 46500, 80000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('44f25223-7cca-41eb-9f1a-c7d9628ed0eb', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP000740', '8938529807188', 'Viên nghệ đen Châu Long Phát', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('6cf7bcb9-049f-4198-8729-70ab69d30581', '44f25223-7cca-41eb-9f1a-c7d9628ed0eb', 'Lọ', 1, true, 48100, 60000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('02584646-343f-4bce-bd91-f167819d5175', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP000739', '8934567022019', 'Kim tiền thảo opc', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('9edaeab9-5419-43ba-9ae1-7aaf2f3365b5', '02584646-343f-4bce-bd91-f167819d5175', 'Lọ', 1, true, 66400, 70000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d997d92a-eca8-4245-9541-b92d6a87d1f5', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP000736', '8936178750220', 'Trinh nữ hoàng cung', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('888fdddc-4f2e-4464-90e5-4cca8b9857de', 'd997d92a-eca8-4245-9541-b92d6a87d1f5', 'Lọ', 1, true, 0, 100000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('ea1a3503-7ca8-4c45-a77d-5b1720dc2fed', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP000735', '8938540618381', 'Ginkgo Nattokinase', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('47bc42a9-2c23-41ab-9ec5-8d7a8cba16db', 'ea1a3503-7ca8-4c45-a77d-5b1720dc2fed', 'Lọ', 1, true, 0, 250000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('eaf65409-dc25-4f23-b396-d5a608943a2f', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP000728', '8938507601401', 'Herba cool vị chanh', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('c3c6855e-f1c9-492d-a200-27ad90054c1a', 'eaf65409-dc25-4f23-b396-d5a608943a2f', 'Hộp', 1, true, 32300, 40000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('27befd26-f848-474e-8732-ac663061c4b1', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP000726', '8938500688256', 'Tiêu khiết Thanh', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('bd69f429-c0cf-4d0b-ae25-17a9179f9a8d', '27befd26-f848-474e-8732-ac663061c4b1', 'Viên', 1, true, 167900, 6000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('02f77ef6-4821-4e23-8277-6ca9fa41ee9a', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP000723', '8934940032437', 'Cebraton', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('73916e6c-24f4-46b2-a069-c0fc02512b67', '02f77ef6-4821-4e23-8277-6ca9fa41ee9a', 'Viên', 1, true, 3004, 3200);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('6e509699-0345-4a35-a72d-27250c8ab978', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP000720', '8934940030389', 'Hoạt Huyết Dưỡng Não Traphaco', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('01f4b87b-a15c-4dc5-9134-8ca2895746d4', '6e509699-0345-4a35-a72d-27250c8ab978', 'Viên', 1, true, 1083.5, 1200);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('775408d5-f6be-4657-b6ce-88628d5579fa', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP000719', '8936079381417', 'Hoạt Huyết Nhất Nhất', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('b4a1d33a-9cb0-4d97-83a4-9f222bcf2a6f', '775408d5-f6be-4657-b6ce-88628d5579fa', 'Hộp', 1, true, 134700, 140000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('0a1677da-fe71-4c79-a5f0-348d64b757d3', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP000714', '8936203427561', 'Multivitamin 20-B', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('2d06e5d8-b467-4326-8bf3-4883f89743eb', '0a1677da-fe71-4c79-a5f0-348d64b757d3', 'Viên', 1, true, 1000, 1500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('b7e1a95f-efb4-4d4f-b7cd-de68b529365b', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP000710', '8936151982419', 'Calci vỉ 10k', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('786ad7a0-012f-4158-97c8-1ea3f2aee609', 'b7e1a95f-efb4-4d4f-b7cd-de68b529365b', 'Viên', 1, true, 600, 1000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('5989da3a-0927-4b7e-8fc6-214f5ea16e09', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP000707', '8936139620128', 'Dưỡng Khớp Linh', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('15c67a56-0d6c-49fb-8544-4f1a92ead5e0', '5989da3a-0927-4b7e-8fc6-214f5ea16e09', 'Viên', 1, true, 2000, 4000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('7a91cdf0-b96b-4e62-a11b-2e3a4098b474', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000705', '8936123411268', 'Calcium Corbiere extra 5ml', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('53a1688e-243f-46e8-a20a-0ffdfe721505', '7a91cdf0-b96b-4e62-a11b-2e3a4098b474', 'Hộp', 1, true, 145000, 170000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('5a8f048c-d081-4e1e-b401-f7a78ca236d1', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP000703', NULL, 'Cồn 70 (Chai Lớn Vòi )', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('5e848848-438d-4902-85fc-06d808a93c87', '5a8f048c-d081-4e1e-b401-f7a78ca236d1', 'Chai', 1, true, 45500, 60000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d4319aae-1db0-49da-b236-f8ea296bc8b0', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP000701', '8935049902829', 'Povidine chai nhỏ', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('101938d8-74e2-435f-a93f-4684f68d43f2', 'd4319aae-1db0-49da-b236-f8ea296bc8b0', 'Chai', 1, true, 6000, 8000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('6a0b7264-cf07-4bfa-a8e0-6229b52422b2', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP000699', '8936024398446', 'Hasanvit C Sủi', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('9f4cc419-19cb-4b8c-90e0-50f22a1bbeed', '6a0b7264-cf07-4bfa-a8e0-6229b52422b2', 'Tuýp', 1, true, 16700, 20000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('99c923e0-53d1-4bbd-abf2-907bfb354729', '80b8c40b-e414-4042-87ef-8ed5adff3c81', 'SP000697', NULL, 'Milian', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('08219f3a-d611-437c-bff3-1473c33a4089', '99c923e0-53d1-4bbd-abf2-907bfb354729', 'Chai', 1, true, 5600, 8000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('4c557fd4-94be-40b5-852d-d811afaf401e', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP000696', NULL, 'Băng Keo Lớn Vitas go', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('7096e814-bdb9-42d1-a954-388d5ad2c932', '4c557fd4-94be-40b5-852d-d811afaf401e', 'Hộp', 1, true, 9525, 15000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('9bfe8cf9-e3b7-4ddd-bd7d-1f88a1e4a1ec', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP000695', '8935049904182', 'Povidine Chai lớn', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('42179bdf-e0b7-4e0f-b124-a142e98b8c5f', '9bfe8cf9-e3b7-4ddd-bd7d-1f88a1e4a1ec', 'Chai', 1, true, 22000, 25000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('8bbc6fa6-1fad-4601-a8b3-38171720d6db', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP000694', '8850109001130', 'Dầu Thái Đỏ Siang Pure oil 3ml', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('86310171-12b2-4e3c-8b10-79a80eafd009', '8bbc6fa6-1fad-4601-a8b3-38171720d6db', 'Chai', 1, true, 17000, 20000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('bcee3519-f369-40b1-acb7-f306c5d2c0b4', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP000693', '8850109001123', 'Dầu Thái lớn siang pure oil', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('a54a777d-f586-4518-a565-3ade1fbbc275', 'bcee3519-f369-40b1-acb7-f306c5d2c0b4', 'Chai', 1, true, 30000, 32000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('1d976549-5362-4892-b0cd-3be4a357e135', '80b8c40b-e414-4042-87ef-8ed5adff3c81', 'SP000690', '8934940010015', 'Trapha traphaco', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('d047ce17-b76f-4593-8756-99e8dad1fa55', '1d976549-5362-4892-b0cd-3be4a357e135', 'Chai', 1, true, 12700, 15000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('f6385e2c-a2a4-452e-995b-8644725c0424', '80b8c40b-e414-4042-87ef-8ed5adff3c81', 'SP000689', NULL, 'Dầu Mù U', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('870a22c3-d23e-4df4-a0a0-6bf5e5da7ced', 'f6385e2c-a2a4-452e-995b-8644725c0424', 'Chai', 1, true, 5570, 10000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d1fc861a-067a-48d2-8bc6-a4523fe4df79', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP000686', '8936043810356', 'Miếng Dán Hạ Sốt', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('869ddd20-da07-4c4c-9971-aec6b5c9db3a', 'd1fc861a-067a-48d2-8bc6-a4523fe4df79', 'Gói', 1, true, 7000, 10000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('721ffd36-db8b-4522-b1e4-bd94213c77c7', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP000681', '8936069240014', 'Gạc Rơ Lưỡi Dopha', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('7a43fa54-a7ef-4a56-885a-4ebbede38b44', '721ffd36-db8b-4522-b1e4-bd94213c77c7', 'Hộp', 1, true, 1500, 2000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('dea453d8-2dad-4078-b349-7c4e30988bcf', '80b8c40b-e414-4042-87ef-8ed5adff3c81', 'SP000680', NULL, 'Gynapax', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('c9214028-4768-4daf-8c9e-cd8985798753', 'dea453d8-2dad-4078-b349-7c4e30988bcf', 'Hộp', 1, true, 27500, 30000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('5d017004-a194-409b-b40b-93b4782764a6', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP000678', '8934567003414', 'Oxy già', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('49ab3a01-530a-48b8-ad2a-a4cf3769c0e2', '5d017004-a194-409b-b40b-93b4782764a6', 'Chai', 1, true, 2250, 5000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('608d253c-f630-4e49-b731-b8d7bbd85121', '80b8c40b-e414-4042-87ef-8ed5adff3c81', 'SP000676', NULL, 'DENICOL-15ML', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('407aeae6-4250-4725-85e9-efe76a6fbf5b', '608d253c-f630-4e49-b731-b8d7bbd85121', 'Chai', 1, true, 20000, 25000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('1729f239-2152-40a4-af54-fb0bc5d7d791', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP000674', '8935049903697', 'Nabifar pharmedic', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('2fd5cfb1-fd05-4fb5-920a-033a527c8ceb', '1729f239-2152-40a4-af54-fb0bc5d7d791', 'Hộp', 1, true, 8920, 10000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('6d847f07-ab41-4761-858b-08ba025c0a6b', '80b8c40b-e414-4042-87ef-8ed5adff3c81', 'SP000672', NULL, 'Vaseline chai', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('67f1dfd4-8d0b-495b-8119-dfc53fe40326', '6d847f07-ab41-4761-858b-08ba025c0a6b', 'Chai', 1, true, 4000, 6000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('3c34dab0-0653-4d0b-a996-20002fab0207', '21a20902-7d3b-443c-89ae-9ebc911810ff', 'SP000670', '42182627', 'Vaseline', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('462a675b-4288-4c5d-8707-877473e87472', '3c34dab0-0653-4d0b-a996-20002fab0207', 'Hủ', 1, true, 49500, 55000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('0d7760c7-28fd-4b06-8f93-f70a0f40ebf8', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP000669', '8935049916956', 'Ddvs gynofar 250ml', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('3c46cfbd-4ad1-45a4-a574-03b288389ee2', '0d7760c7-28fd-4b06-8f93-f70a0f40ebf8', 'Chai', 1, true, 16750, 20000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('8d9aae71-5edf-4d77-a52e-6290c8be3144', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP000668', '8935049916963', 'Dung Dịch Gynofar 500ml', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('23072563-8812-41f5-bd7a-aea3dd56ae74', '8d9aae71-5edf-4d77-a52e-6290c8be3144', 'Chai', 1, true, 23700, 27000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('cbbd1827-1768-48fa-8832-08e11d467ef9', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP000666', NULL, 'Gội là Đen', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('0b0a990c-2522-4956-a536-ce9909169564', 'cbbd1827-1768-48fa-8832-08e11d467ef9', 'Gói', 1, true, 15380, 20000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('0cae0c97-a430-4b77-b031-188b831f2d8b', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP000665', '8936051012223', 'Gội là Nâu', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('7212c074-0cdd-4340-b371-1a9940bd71e9', '0cae0c97-a430-4b77-b031-188b831f2d8b', 'Gói', 1, true, 15000, 20000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('e8baebb3-0416-42b1-848b-6d997c04c715', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP000664', '8936024920081', 'Tăm Chỉ Nha Khoa', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('367b3345-3006-4b15-a605-65bf9fd6398a', 'e8baebb3-0416-42b1-848b-6d997c04c715', 'Hộp', 1, true, 20000, 25000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('e13a43cb-1367-4671-82c3-3ad7de46bad1', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP000663', '8936043811797', 'Tăm Chỉ Denta', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('8785b6ed-28f5-4163-9756-63cb1e7c55ba', 'e13a43cb-1367-4671-82c3-3ad7de46bad1', 'Cuộn', 1, true, 21300, 25000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('97b91767-643e-40c3-8298-7bd6334d5ab7', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000662', '8938521795018', 'Snow Clear gói 5ml', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('0cb2db1d-461c-4ee2-888e-6bd61bdfda58', '97b91767-643e-40c3-8298-7bd6334d5ab7', 'Gói', 1, true, 5340, 7000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('26e424bc-9878-4224-afeb-d73c8848d75a', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP000661', NULL, 'Bông 100g', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('f8f5bf48-e879-4c18-9692-d4cd54c233a4', '26e424bc-9878-4224-afeb-d73c8848d75a', 'Gói', 1, true, 17000, 25000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('59ca72a5-6d95-456c-8eb8-83b4a3b73d99', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP000659', '8938507697497', 'Băng Keo Lụa Nhỏ', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('cd84b207-5d16-4e78-b8d9-f13ad0e5b245', '59ca72a5-6d95-456c-8eb8-83b4a3b73d99', 'Hộp', 1, true, 5700, 10000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('36f3341e-025e-4c31-a50c-085edaf2787c', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP000650', '8936062880989', 'Ho Đỏ', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('542b0b9b-45f1-4f78-bfd3-2135e2ebc596', '36f3341e-025e-4c31-a50c-085edaf2787c', 'Viên', 1, true, 280, 500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('24831f11-e835-48df-a0ce-1089a96249b2', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP000648', '8935049904328', 'Tyrotab', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('321d9304-abc9-4613-a692-a00b99dcb836', '24831f11-e835-48df-a0ce-1089a96249b2', 'Vĩ', 1, true, 3100, 5000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('2a84043f-31c3-4577-b2af-59660955a6eb', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP000646', '8936193782190', 'Sắt Ống', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('3109bb3a-245d-4e22-94e9-797a9123eba8', '2a84043f-31c3-4577-b2af-59660955a6eb', 'Ống', 1, true, 0, 7500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('ea32794e-e01a-42b6-9786-65d1eadf19d8', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP000642', '8936193782275', 'Chất Xơ Pooh Kids', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('62efc6df-46be-413c-bcaa-e41129b076a0', 'ea32794e-e01a-42b6-9786-65d1eadf19d8', 'Ống', 1, true, 3000, 5000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('075accdb-c6d2-48c4-ba85-2eb73280272a', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP000641', '8938540796539', 'Cà Gai Leo Actiso', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('683980e3-e33c-4848-82a1-b92150fe4ed1', '075accdb-c6d2-48c4-ba85-2eb73280272a', 'Ống', 1, true, 4000, 6000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('9c4448d7-2e65-4053-a2ef-b1cda67b6663', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP000638', '8936224540430', 'Canxi Nano Plus', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('6c24aa92-5f64-4bb7-b2a1-e2ad4d9a1e69', '9c4448d7-2e65-4053-a2ef-b1cda67b6663', 'Ống', 1, true, 5000, 7500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('80828c02-5866-49f3-9196-2e9ee025d2fd', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP000637', '8938536412115', 'Khẩu Trang Em Bé', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('20a39560-a129-404c-a810-e0059012b7e8', '80828c02-5866-49f3-9196-2e9ee025d2fd', 'Gói', 1, true, 4000, 10000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d568d210-fbe7-4792-8025-7a1f46d93c36', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP000636', '8934574060066', 'Kẹo C', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('cb89d55d-06f0-46ba-bcd2-e8ef17d3371d', 'd568d210-fbe7-4792-8025-7a1f46d93c36', 'Gói', 1, true, 4245, 6000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('7bda7211-2d6b-406f-87cf-167c56dbe8d0', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP000634', NULL, 'Kẹo Sữa Ong Chúa', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('a7c9cdc4-9735-4b21-81d4-a53f158b6ccd', '7bda7211-2d6b-406f-87cf-167c56dbe8d0', 'Lọ', 1, true, 6200, 10000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('e6ace140-a1fb-4ec6-92a8-46dd24d27b30', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP000633', '8938555193033', 'Bông Tẩy Trang Nakori', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('0868c050-14b4-44c0-a7a6-ae569d366c2e', 'e6ace140-a1fb-4ec6-92a8-46dd24d27b30', 'Gói', 1, true, 28000, 35000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('98c97cad-ee6e-4b2c-9e6d-cb931e202391', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP000632', NULL, 'Kẹo Hi Chew', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('3769560a-fd69-420f-b674-b8dc4670cd78', '98c97cad-ee6e-4b2c-9e6d-cb931e202391', 'Cây', 1, true, 12000, 20000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('d068eeb4-e43e-4d6d-853b-644ed2fc0d4d', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP000631', '8936220251583', 'Omega 369', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('952fe87e-f197-4b9c-803f-5ba5bb453679', 'd068eeb4-e43e-4d6d-853b-644ed2fc0d4d', 'Hộp', 1, true, 90000, 150000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('a630b241-f229-49ae-a89a-474ba184c891', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP000629', '8935049900016', 'Aspartam Đường Ăn Kiêng', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('b4facdc0-564b-4b6a-a094-24793d2f4a5b', 'a630b241-f229-49ae-a89a-474ba184c891', 'Hộp', 1, true, 33200, 40000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('9cd8e5c7-240d-42d8-b567-9c28ab7bb9b1', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP000627', '8938530908614', 'Vitamin E đỏ ch/60v', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('9c5b53ea-873b-46e1-a40b-e3139d4b897a', '9cd8e5c7-240d-42d8-b567-9c28ab7bb9b1', 'Hộp', 1, true, 100000, 150000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('9b9d4c40-87b5-40a8-ac2b-5859d4550e8c', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP000626', '8936139620630', 'Trà giảm cân Đông Dược Việt', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('5d346115-578d-42a5-9260-98f256a7de35', '9b9d4c40-87b5-40a8-ac2b-5859d4550e8c', 'Hộp', 1, true, 250000, 350000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('46b74b7a-4b5f-4382-a714-4c84821b0a06', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP000625', '8938527456463', 'Vitamin E ( Vàng )', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('cb03bc6f-893f-4778-b9f5-fa8228981d0e', '46b74b7a-4b5f-4382-a714-4c84821b0a06', 'Viên', 1, true, 1000, 1350);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('c52ff0f0-4d33-446e-a0f3-386cf625f5ab', 'ca58e770-20fc-4bda-a470-d79dad5bf7fb', 'SP000624', '8938530372927', 'Ginkgo tốt 20k', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('57cd1c52-0702-40d6-8c0c-d71c01c6bb33', 'c52ff0f0-4d33-446e-a0f3-386cf625f5ab', 'Viên', 1, true, 1000, 2000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('b7054673-62bc-4a7d-a440-f5bbf2de8966', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP000619', '8850007813040', 'Listerine 250ml', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('422b8aa4-8c58-4d7d-ad71-105b2c5fb5e2', 'b7054673-62bc-4a7d-a440-f5bbf2de8966', 'Chai', 1, true, 37000, 40000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('5fa63647-662a-42a9-bd80-0eb12843ab34', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP000618', '8936206260196', 'Dung Dịch Vệ Sinh Hồng Hương', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('b5de79f0-dceb-4203-93ba-88489cd2ebb4', '5fa63647-662a-42a9-bd80-0eb12843ab34', 'Chai', 1, true, 40000, 60000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('1c8576fe-6c9e-456d-a348-05ccaa9f0374', '80b8c40b-e414-4042-87ef-8ed5adff3c81', 'SP000617', '8938554952006', 'Xịt Pisy Spray', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('cae54ade-3f45-420d-b7d9-f38602c8c105', '1c8576fe-6c9e-456d-a348-05ccaa9f0374', 'Chai', 1, true, 40000, 60000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('f9a1386c-3fda-46f8-b5bd-5cd17ec2701c', 'c4ec852b-1bee-40b4-8477-431921cc8073', '8938521795001', '8938521795001', 'Snow Clear 50ml', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('76688e03-fd0e-44f3-ab8b-ce71c25d4cf5', 'f9a1386c-3fda-46f8-b5bd-5cd17ec2701c', 'Tuýp', 1, true, 54000, 60000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('534b94a6-627c-45ce-9192-862591042cbc', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP000616', '8936009151462', 'DDVS Dạ Hương', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('563b3e6c-311e-40b0-bc4f-64a26408e953', '534b94a6-627c-45ce-9192-862591042cbc', 'Hộp', 1, true, 38000, 42000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('2260465b-64db-4e1d-aab0-be97652609d1', 'b96408e2-de7a-4f65-b5f7-72b5bfd47d9f', 'SP000615', NULL, 'V.Rohto vitamin', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('2eee111a-768b-4a39-b527-3270f006385b', '2260465b-64db-4e1d-aab0-be97652609d1', 'Lọ', 1, true, 52400, 54000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('e03960af-3cca-49e0-bfa0-b45cf9b68630', 'b96408e2-de7a-4f65-b5f7-72b5bfd47d9f', 'SP000614', NULL, 'V.Rohto Cool', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('43eb4c64-095b-4d47-bd5c-3870a4b8eec9', 'e03960af-3cca-49e0-bfa0-b45cf9b68630', 'Lọ ', 1, true, 58000, 59000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('ce9de53a-4c1e-4b34-af02-ca1a33fd368b', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP000610', NULL, 'Bơm Tiêm 5cc', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('6956f250-42f5-482f-aed9-ba6848b4049a', 'ce9de53a-4c1e-4b34-af02-ca1a33fd368b', 'Cái', 1, true, 667.4, 1500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('44e135cc-2140-44d7-846c-67fa4543b37c', 'dc78a0ea-7f7b-430e-bbe1-ee371262a804', 'SP000607', NULL, 'Bơm Tiêm 10cc', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('151065da-58ac-4889-acc4-86f044cf708a', '44e135cc-2140-44d7-846c-67fa4543b37c', 'Cái', 1, true, 1036, 2000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('e9483cdc-acd4-474c-917b-5ce1606bd14a', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000594', '8934690001332', 'Bidisamin 500mg', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('cde55fb2-42c8-4731-b710-24a64709ce3a', 'e9483cdc-acd4-474c-917b-5ce1606bd14a', 'Viên', 1, true, 800, 1500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('df30f23f-4cfc-46cf-8c61-4940e0c1a658', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000552', NULL, 'Soslac G3', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('6e4f535e-0a15-4008-906e-d646f1c1bd39', 'df30f23f-4cfc-46cf-8c61-4940e0c1a658', 'Tuýp', 1, true, 22800, 25000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('3859d151-705d-4733-920b-174da43678ff', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000550', NULL, 'Salonpas Dán', true, 'cea87d8f-8caf-4eff-a8fd-76754d4e0cac', 'Dán');
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('002f3ed2-1a13-4933-accf-22171aeaabc0', '3859d151-705d-4733-920b-174da43678ff', 'Miếng', 1, true, 1300, 1500);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('c4f5be50-1af3-48fd-a374-9ea8d858133c', '920e490d-b1d8-4775-9677-34874f9458b2', 'SP000549', '8935049902812', 'Natri clorid 0,9%', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('93e1fac7-cd9c-4ad3-90cd-282e4ccd026f', 'c4f5be50-1af3-48fd-a374-9ea8d858133c', 'Chai', 1, true, 3080, 4000);
INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('1facd7cf-f475-481e-ab7b-54eeb8c37fc9', 'c4ec852b-1bee-40b4-8477-431921cc8073', 'SP000523', '89352060162841', 'Diclofenac DHG', true, NULL, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('c7b73c9a-e8f2-4654-89fe-7d199fcde398', '1facd7cf-f475-481e-ab7b-54eeb8c37fc9', 'Viên', 1, true, 226, 250);

INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('d14798ca-1c8d-48f8-9572-7c2dad778e75', '78f50102-dd61-476b-a9b7-16abee18bd0e', 'Vỉ', 10, false, 13000, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('ceceff34-523d-49c5-8e10-985f0a0470a3', '78f50102-dd61-476b-a9b7-16abee18bd0e', 'Hộp', 60, false, 78000, 120000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('f102d4d7-d0f1-4c9a-837a-0a893dc18c59', '551bf49b-699f-4511-af53-48c243203de7', 'Vỉ', 10, false, 10395, 15000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('af8728cf-da92-4b1b-8e68-487e75454903', '551bf49b-699f-4511-af53-48c243203de7', 'Hộp', 50, false, 51975, 75000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('10a9561a-d818-405c-ac74-d914bec73b7d', 'aa7963e6-e8e7-4cca-b88f-6b7fcb6f65f3', 'Hộp', 20, false, 76500, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('6640c0cd-cc82-4498-a7e6-a11e70daf91a', '975fb319-f9bd-4148-8575-ee8a31ebf076', 'Hộp', 3, false, 29400, 36000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('dc92600c-599c-4750-9b50-ec768ce5d0cb', '634e6a23-1010-4e2d-864f-687fb7bddd17', 'vỉ', 10, false, 0, 0, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('e00b4cae-eaae-45d4-8ce0-cf7ecb567c8a', '634e6a23-1010-4e2d-864f-687fb7bddd17', 'hộp', 100, false, 0, 0, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('70179545-3c19-4b36-a003-435a4188710c', 'bb52b1a8-75cf-4a1f-a25a-a7a026875ed1', 'vỉ', 10, false, 5920, 8000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('cafbfe5b-0d82-4eba-a778-44961239c7c9', 'bb52b1a8-75cf-4a1f-a25a-a7a026875ed1', 'Hộp', 100, false, 59200, 80000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('e0c23c4f-ff6d-4d91-8a45-840721cd4817', 'e98baf72-dae1-44b2-9c9d-892c2d9dbd81', 'Vỉ', 10, false, 0, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('fa80cfff-9d77-49ec-826d-f81833b16177', 'e98baf72-dae1-44b2-9c9d-892c2d9dbd81', 'Hộp', 100, false, 0, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('85b6d12a-98fd-4616-8bdc-3595b444b955', '61f6640a-95f9-448e-9c3e-a0150c166d5d', 'Vỉ', 10, false, 0, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('1c0b246e-5c2b-457c-82c6-cbf46c61c282', '61f6640a-95f9-448e-9c3e-a0150c166d5d', 'Hộp', 100, false, 0, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('40b051d1-8f7a-4dd8-83e9-c7b626b88fa3', '108699e6-ed71-4896-996a-6c6fc898a916', 'Hộp', 12, false, 68036.4, 78000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('7377c239-4709-468e-a6b7-909b3ff3a760', '84d1960f-a02c-4f23-9c10-4e5f4a8c7d87', 'Vỉ', 20, false, 6000, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('2fcae5ae-2b96-4d27-bff3-947fc14964b2', '84d1960f-a02c-4f23-9c10-4e5f4a8c7d87', 'Hộp', 300, false, 90000, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('97305957-1872-4c11-b482-51dd795e0774', '5b37f464-0c43-489d-83e9-192fab43460f', 'Vỉ', 10, false, 4300, 6000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('75281768-7809-4759-a1ca-a7118b65cd6b', '5b37f464-0c43-489d-83e9-192fab43460f', 'Hộp', 100, false, 43000, 60000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('c5c6606f-af81-4949-bc20-41747eb016c8', 'f0cec852-6f80-458b-ae3a-9ceb6b7e29e3', 'Vỉ', 10, false, 18000, 60000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('aff96eb6-9dc5-42c3-9102-0d23c949a56c', 'f0cec852-6f80-458b-ae3a-9ceb6b7e29e3', 'Hộp', 100, false, 180000, 600000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('964ae114-ed63-4576-afad-4a6828ecce65', 'dc279e14-82d9-4879-865f-3997efd05b4d', 'Vỉ', 10, false, 46800, 60000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('05ada857-bdeb-4282-bb5d-5e84eede8adf', 'dc279e14-82d9-4879-865f-3997efd05b4d', 'Hộp', 10, false, 46800, 60000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('3523137a-0fc5-4f6f-a174-ebbf00423171', 'bec9f50d-c664-47c7-aa6e-5a16eeeaccf6', 'Hộp', 100, false, 69000, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('9f33553b-d89d-4359-802a-f510e28d62ac', '52872081-a605-43b9-9711-d3b0c5589a40', 'Hộp', 50, false, 492413.5, 600000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('0c92639b-a247-4275-87e8-9d9ce5282a95', '8aa7cefc-b007-4119-b36c-ec1c1ece85a4', 'Vỉ', 15, false, 16500, 30000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('6ceb6c74-c539-4c2a-ae93-1ef0849089fa', '8aa7cefc-b007-4119-b36c-ec1c1ece85a4', 'Hộp', 75, false, 82500, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('902bbef5-63a4-47ee-a0db-7b1cdca04fa8', 'f6c77fce-c63f-4d58-8e9c-8526d95ed970', 'Hộp', 10, false, 35000, 60000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('61cfc088-9643-4de0-bb41-1b4b96dd8119', 'f6c77fce-c63f-4d58-8e9c-8526d95ed970', 'Vỉ', 10, false, 35000, 60000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('3dbedbf1-deca-4b3a-84c5-5918d26a3a10', 'cdc888ce-f6d4-4599-a5c0-112d54089eee', 'vĩ', 5, false, 6900, 13000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('1ba45138-bf84-4b00-885f-9ce3b1da0aca', 'cdc888ce-f6d4-4599-a5c0-112d54089eee', 'hộp', 50, false, 69000, 130000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('c095b1f3-d808-49ba-99d5-364e2161ddf2', '684e85fa-c43e-495b-9399-72ec500abcf1', 'Vỉ', 10, false, 10000, 15000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('b4233470-f729-4587-90c3-1918ee2be32d', '684e85fa-c43e-495b-9399-72ec500abcf1', 'Hộp', 30, false, 30000, 45000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('dfb9e10d-d618-4232-aa9e-ba5da5ce1160', '2779d5f2-1958-4e8b-ba3f-38aa4f7dee16', 'Vỉ', 10, false, 73330, 90000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('3173c025-c982-47a8-8b04-188067994ba9', '2779d5f2-1958-4e8b-ba3f-38aa4f7dee16', 'Hộp', 30, false, 219990, 270000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('f4c18109-65c0-48ea-99a2-638b1be02603', 'b48a3fe0-b4a4-4af3-b2c8-8d4e978135f4', 'Vỉ', 10, false, 13000, 25000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('0eadb801-5814-4eee-9104-1183bf4c1d70', 'b48a3fe0-b4a4-4af3-b2c8-8d4e978135f4', 'Hộp', 30, false, 39000, 75000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('83dbe886-f680-47c3-a4a4-d1297f526e88', 'f35cb0d1-2aba-41b4-aee3-f6fb8b8c30ab', 'Vỉ', 10, false, 10000, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('c3ba9eeb-fdc6-4c7e-83f7-1c16867ef237', 'f35cb0d1-2aba-41b4-aee3-f6fb8b8c30ab', 'Hộp', 30, false, 30000, 60000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('24a616ae-f829-420d-bb2f-37db068c4787', 'b139f094-e932-4e17-b55a-866968219bc9', 'Vỉ', 10, false, 24500, 30000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('78919f97-5c26-482d-863a-069d4daec42e', 'b139f094-e932-4e17-b55a-866968219bc9', 'Hộp', 20, false, 49000, 60000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('0cb940da-50b8-45bf-bc50-a02ffef22c0b', '9d3b51b8-13da-4edd-9396-5dbcbe819f0f', 'Hộp', 15, false, 86700, 120000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('adf5560d-667a-4781-9460-1dfe71456a0d', 'd3793d49-43e0-4ad1-aa0e-569c462f0443', 'Hộp', 10, false, 10000, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('120a9639-a7e0-4f77-a96f-f7e8ef39b30f', '7ece1a92-eb97-4440-a789-40ec41d0d4d3', 'Vỉ', 10, false, 5000, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('22022599-b3f3-4daf-acfd-db08293b4944', '7ece1a92-eb97-4440-a789-40ec41d0d4d3', 'Hộp', 100, false, 50000, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('f8b72b5b-9cab-4949-822c-3ec6dcf6b521', '8a590f32-5c66-41f7-821f-77efafe335fc', 'Vỉ', 10, false, 30000, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('a5ba2e2b-3d5d-4013-8bf0-93ee7574e2d4', '8a590f32-5c66-41f7-821f-77efafe335fc', 'Hộp', 30, false, 90000, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('eafb1995-7df5-4f94-bf04-a29d945837ce', 'ef979d87-4430-42cd-ae25-817f399257fb', 'Vỉ', 10, false, 3700, 7000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('f809e9ed-cbed-4f5b-baec-208e769bc2c6', 'ef979d87-4430-42cd-ae25-817f399257fb', 'Hộp', 100, false, 37000, 70000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('b5713633-fee1-483c-a9d9-6921063193a0', 'f274de4a-1fe3-4fb3-90e6-5fd0b58f656d', 'Hộp', 10, false, 0, 0, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('eb09c638-1561-4e38-b592-0933eefae6c4', '1759d73c-296c-421b-9e76-dcba04cef897', 'Vỉ', 10, false, 40000, 60000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('a9ff0928-e90e-4c8b-802c-00a52be51d5a', '1759d73c-296c-421b-9e76-dcba04cef897', 'Hộp', 20, false, 80000, 120000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('03387846-31d1-4e18-9ac2-ba753e6396b5', 'cde3dfb6-d131-46b3-92bf-20f22d6bca21', 'Vỉ', 12, false, 16800, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('1ba7671f-7748-45a5-8884-2faa215fcb84', 'cde3dfb6-d131-46b3-92bf-20f22d6bca21', 'Hộp', 24, false, 33600, 40000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('928df0ec-be8b-42c1-bc3f-ee2a8fef164f', 'bb845484-7f08-4061-8534-e1bc98484765', 'Hộp', 60, false, 101100, 240000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('e44c75ab-bd35-4cee-a814-6323c97fb765', 'bb845484-7f08-4061-8534-e1bc98484765', 'vỉ', 5, false, 8425, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('69c64fbd-e31e-4d8f-a718-4b32288d4b44', '88f62e25-5d9d-411c-a971-dff860c809f4', 'Tuýp', 10, false, 35000, 60000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('786730b2-4898-4d3c-8b8f-4b07c7f0a9aa', 'a04cbaf4-561a-42c3-9f28-93f382d603fe', 'Vỉ', 5, false, 29750, 37500, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('b1c7df9e-f452-4bc2-8001-9bfae56d7ccc', 'a04cbaf4-561a-42c3-9f28-93f382d603fe', 'Hộp', 20, false, 119000, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('acc155b7-4b46-40d0-9848-88d5d8ba96a1', '69a307be-28d3-4cf0-abb5-102aac877afa', 'vỉ', 4, false, 11500, 16000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('35f65c4c-592f-47c4-bf3a-6ff60696cebd', '69a307be-28d3-4cf0-abb5-102aac877afa', 'Hộp', 24, false, 69000, 96000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('2de509bf-0222-4582-b8c2-cc513e09bad4', '41555498-f606-4ff5-ac29-e64b49f8e023', 'vỉ', 10, false, 30500, 35000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('de685019-a366-40cd-bd45-25c867bce5e0', '41555498-f606-4ff5-ac29-e64b49f8e023', 'hộp', 100, false, 305000, 350000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('19086c24-0fdd-40fe-8e64-ea2c83340aa1', '0a073733-d48d-42a7-81c4-a3780b0365eb', 'vỉ', 10, false, 56000, 85000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('f7c75603-ad03-47b5-90f5-9f6d4921a6cd', '0a073733-d48d-42a7-81c4-a3780b0365eb', 'Hộp', 30, false, 168000, 250000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('25a569a1-8415-48fc-8b9e-38e439d1a4fd', '779c4655-2838-402f-baa1-8cd37af23ab5', 'Hộp', 20, false, 0, 120000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('3e4ded69-7e91-4c40-94f4-fb54f6958355', 'fb880f78-260e-4c27-8ca6-82824112eaeb', 'Hộp', 5, false, 35000, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('1d430fda-8594-4591-8bf2-34743d5dafab', '1992f7d7-030a-4ee2-b287-514c9c81e7d9', 'Vỉ', 14, false, 16240, 28000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('6ec29efd-9d64-4197-b78f-e3a24213c8f0', '1992f7d7-030a-4ee2-b287-514c9c81e7d9', 'Hộp', 28, false, 32480, 56000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('d81992d7-89cc-4934-bdba-2c7fbb652a59', 'a471d67f-7e7f-4341-a590-b67648b6dc08', 'Vỉ', 10, false, 12000, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('60e1aa36-803e-4672-b09d-89cf28acfde0', 'a471d67f-7e7f-4341-a590-b67648b6dc08', 'Hộp', 50, false, 60000, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('dd3d03cb-df99-464a-b812-f686b55475a6', '9ebfccc3-fb94-46e8-86dc-9e7039ef3601', 'Vỉ', 10, false, 3290, 5000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('2f9f043f-85f2-4417-ba4c-9ed7040f0439', '9ebfccc3-fb94-46e8-86dc-9e7039ef3601', 'Hộp', 100, false, 32900, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('0b2ea18a-81b7-4746-b1cf-ecf495002de5', 'a5d34e7d-409b-4245-a9e1-d0ce1a462b95', 'Vỉ', 5, false, 7710, 15000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('14ee285b-29e8-4dce-90a4-f10210d568f4', 'a5d34e7d-409b-4245-a9e1-d0ce1a462b95', 'Hộp', 50, false, 77100, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('565532af-b93c-451f-9649-08aa2932435e', 'cf9b81c5-ed5f-4818-8b6b-83bb5b85d725', 'Vỉ', 10, false, 7000, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('b6ebe19f-30da-4ee4-82d6-d794300f4a86', 'cf9b81c5-ed5f-4818-8b6b-83bb5b85d725', 'Hộp', 50, false, 35000, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('df846ce4-48a0-4a1e-8c7f-375cdc181230', 'dc39371f-3afd-420a-ae44-20eafa8ba24e', 'Hôp', 10, false, 20000, 30000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('5401a08c-724e-4df6-b02a-4849cc21e604', 'ec8c8ca4-e641-49c0-9220-863ba662a0da', 'Hộp', 10, false, 23000, 26000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('0a15dc7c-1fe8-4d6c-9483-5d0d2a786724', 'dd5be500-7e2d-4f38-a724-8708517be2df', 'Hộp', 10, false, 70000, 90000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('3afa2250-7f23-420b-b756-e2ace1f959f2', 'f33e59d1-428a-4321-9a7b-42390c69ce20', 'Vỉ', 20, false, 40000, 80000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('394014fa-c1e2-405c-96e5-a16e4ed0e642', 'f33e59d1-428a-4321-9a7b-42390c69ce20', 'Hộp', 60, false, 120000, 240000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('8f447304-63b7-4873-9d4b-1106d0dcb54c', 'e7907228-7e4e-46e9-b4c1-752a49b3cf80', 'Hộp', 24, false, 46080, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('224f65af-9059-4307-83c4-ee4e67d7c069', '0077660b-3b83-4b93-beec-9ec9c9b63add', 'Vỉ', 10, false, 8500, 15000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('f807d6e5-3990-4ee4-adf7-39317db4dd6e', '0077660b-3b83-4b93-beec-9ec9c9b63add', 'Hộp', 100, false, 85000, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('84b4b598-79c9-4b71-bc2b-728477f173d3', '555db8a2-9fba-4318-9b9b-ab8676274d56', 'Vỉ', 10, false, 65000, 70000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('8c41fa48-32c6-4841-986a-a222c687c0d8', '555db8a2-9fba-4318-9b9b-ab8676274d56', 'Hộp', 50, false, 325000, 350000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('243819f8-6f6b-485f-be48-2994bb5928c9', '1b94108e-c9ca-407b-9c68-ab9f38b006fa', 'Vĩ', 10, false, 30500, 40000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('7fa511b4-9fc4-4178-b1b7-c1ef667a7043', '1b94108e-c9ca-407b-9c68-ab9f38b006fa', 'Hộp', 100, false, 305000, 400000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('9dbd5b32-38bc-40a4-ad5d-53d4d0b701ba', '501bf813-458c-4835-9c1f-34cc3c1b6748', 'Hộp', 30, false, 39000, 60000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('081c2161-b94e-4f82-af54-e262b951e2df', '82dfa614-bd24-4813-85bb-5c47c14a1171', 'Hộp', 5, false, 25000, 35000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('de0a32d6-53cc-407d-976a-71192dd7190a', '0253842e-7b7e-4e02-88a5-df637c621e36', 'Hộp', 20, false, 110000, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('0dc1a479-4d54-4743-ae18-b8ac7e2001c5', '48a52d96-606d-4cae-877e-3599d6b704e0', 'Hộp', 24, false, 40200, 44000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('373bd707-6a71-45cf-a5de-3472d92a9e79', '61b633e5-a621-4cc5-84dd-dde0d5a17811', 'Vỉ', 12, false, 4200, 6000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('5abe4667-f35b-4224-87bc-37abb4d555ae', '61b633e5-a621-4cc5-84dd-dde0d5a17811', 'Hộp', 120, false, 42000, 60000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('3910c5d2-4561-4198-be2a-2f00e373b636', '5cd30ddf-2cbc-4b7c-acdb-a040a83876b7', 'Vỉ', 10, false, 9600, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('68f99eda-a234-4e94-be49-e8ef22434553', '5cd30ddf-2cbc-4b7c-acdb-a040a83876b7', 'Hộp', 100, false, 96000, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('b859d3d1-8cd3-4918-aafa-e8ae4867f25f', 'fe5038d1-e747-49c5-ae0a-f73ee3508fcd', 'Vỉ', 10, false, 16000, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('e25bbdfe-928f-40ae-a6cb-1b6f563afe55', 'fe5038d1-e747-49c5-ae0a-f73ee3508fcd', 'Hộp', 180, false, 288000, 360000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('9795954e-eda7-4dbf-a42b-9ea52d1808ff', 'd436626e-a32e-46c5-88e1-af0037bacda2', 'Hộp', 10, false, 48000, 60000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('429a9e50-284c-4abb-999b-d7a266daf8aa', '9b5a0cad-eee1-46a3-882f-023036f6bbf2', 'Vỉ', 10, false, 31800, 80000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('576b7616-e892-44c1-a462-34e355887761', '9b5a0cad-eee1-46a3-882f-023036f6bbf2', 'Hộp', 100, false, 318000, 800000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('8cb6d414-42d9-4b88-93de-0cdd8ff65992', 'df78ae33-ce42-400b-b21d-b1d545b2b32e', 'Vỉ', 10, false, 28000, 60000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('0f304b5e-10dd-4a9e-977c-08c624d3a7ba', 'df78ae33-ce42-400b-b21d-b1d545b2b32e', 'Hộp', 60, false, 168000, 360000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('898d3417-b908-40c4-81ed-07a243d43064', 'ec1e0e1a-388f-4b4b-8f22-4fc2919c6fe0', 'Vĩ', 10, false, 8900, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('b1768936-69ab-47d3-b851-be6a840366f1', 'ec1e0e1a-388f-4b4b-8f22-4fc2919c6fe0', 'Hộp', 100, false, 89000, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('7e1efe62-2b73-4ae2-b89a-006fd427c301', '887a10fc-4161-4797-9240-d04a20753b0e', 'Vĩ', 5, false, 3000, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('5f34b866-57ac-4828-a031-06b96d5b28f8', '887a10fc-4161-4797-9240-d04a20753b0e', 'Hộp', 60, false, 36000, 120000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('0e7a8457-d777-4fbb-b464-25494b8b6ddf', '15d4591d-1ea6-4603-9276-326d91fddbfd', 'Vĩ', 10, false, 3000, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('587075de-eb62-463c-970a-6517d3b61a3b', '15d4591d-1ea6-4603-9276-326d91fddbfd', 'Hộp', 100, false, 30000, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('ed4dc048-0504-4ded-88c3-8c2b58e62c88', 'ad794b8a-b191-411f-866d-d606aa27e443', 'Vĩ', 10, false, 3500, 5000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('41b0d6e1-a2c2-4c6d-ada1-a15a28ecc9ad', 'ad794b8a-b191-411f-866d-d606aa27e443', 'Hộp', 100, false, 35000, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('fbfa2a67-4e67-4b82-a406-14d0d57edd3a', '7d464273-b267-41b2-a8e9-1ae3400724da', 'Hộp', 100, false, 185300, 200000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('18ce0c9f-2717-4f2b-8245-c6e042feedca', '7d464273-b267-41b2-a8e9-1ae3400724da', 'Vỉ', 10, false, 18530, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('1dccc045-13bb-404b-9de3-81431c1f4a8d', 'cfd010f6-acd2-4ed6-b056-8290bc7cbb75', 'Vỉ', 10, false, 1900, 5000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('03432b84-c071-4696-a1a2-0e33526d18be', 'cfd010f6-acd2-4ed6-b056-8290bc7cbb75', 'Hộp', 200, false, 38000, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('f5edd8ea-554b-40d4-99c6-caa5e842dba3', 'a2aec0fa-bf82-4ab2-89d6-b6f7f5d3426e', 'Vĩ', 10, false, 5000, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('80671d9c-cd8e-4f8a-89f8-73e682217f49', 'a2aec0fa-bf82-4ab2-89d6-b6f7f5d3426e', 'Hộp', 30, false, 15000, 60000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('5061feab-9fb7-427e-9e32-ac18a354cca6', 'c9fed49e-95b4-4443-bd31-867e29e40882', 'Vĩ', 10, false, 2900, 5000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('57b97364-256f-4cef-8884-38ca97d17e3e', 'c9fed49e-95b4-4443-bd31-867e29e40882', 'Hộp', 100, false, 29000, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('dbee443c-85b6-4dc3-a3c2-c32011b15096', 'ec4540d5-5997-49df-9974-291eb3a9d3b0', 'Hộp', 20, false, 280000, 300000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('7d5ba216-277b-4553-b5ec-88eafed1387e', 'd2fcecdc-683c-4358-9a5f-c65e6ac775c7', 'Hủ', 200, false, 80000, 200000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('f89b02fa-2dec-46da-947f-dddb48744c63', '2dd974b9-566e-417b-9dda-6911f5e6be8b', 'Hủ', 300, false, 120000, 300000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('e37a1d84-836d-4d23-a67f-6bdec6e84739', '9caaf1cd-ad14-4759-bdd6-7bf63676d26d', 'Hộp', 30, false, 57000, 90000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('268e0820-9142-42f7-aea7-edbe69cddb20', 'fc061104-e340-4544-8312-4393d3cc8a89', 'hộp', 50, false, 250000, 450000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('7e53221a-a080-472d-afe1-8dd7a2d2d254', '3dc175fb-3590-46c2-9d49-2466ca4bd9bc', 'Hộp', 100, false, 60000, 85000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('b9f88cbb-b84b-427e-9c90-bba6f914bc58', 'be3e6ea7-ff4a-40d1-989c-dd2762d6d6a4', 'Hộp', 5, false, 342820, 400000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('188bdf7b-2902-4dfb-86e7-b92d99a8a467', '430d68d3-9171-4a39-8127-8724906395d9', 'Lọ', 30, false, 90000, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('594c48ed-9802-4e7d-b4af-45466eac6415', '87ae36c0-ae39-4104-855d-afdbd6e03250', 'hộp', 10, false, 18200, 0, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('e3aeeac8-ab61-4914-96f6-6f757cce4da7', '323c12eb-e9b3-4768-9278-4fc4dc9f0200', 'Hộp', 100, false, 69900, 0, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('0c93960a-5d58-4e09-a740-f10e98ac6bb3', 'd2ee3cf0-e042-4bbf-a042-a276e16e1703', 'Hộp', 1, false, 20000, 0, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('e107c28d-f3e4-4bba-ada4-dadbb43b9d64', '34762300-5747-4f18-a405-104420167f47', 'Hộp', 100, false, 229600, 0, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('3d8b805c-c205-48b9-b773-57893a4bdc49', 'a9c12fe5-0d26-4998-bb8e-649a0af4ccb1', 'Hộp', 12, false, 20700, 0, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('23f7950a-1b27-4a78-b3e3-2c482a798cc8', '8184b375-5af0-4829-b0b2-7889bb54a0cf', 'Vỉ', 4, false, 4780, 6000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('911af3fc-e0d0-4c0e-a0e8-f7e5fc654c28', '8184b375-5af0-4829-b0b2-7889bb54a0cf', 'Hộp', 120, false, 143400, 180000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('e844e83e-5a64-4ee0-b93f-f3422e4bbb2f', 'fb83b932-bf61-447e-a616-2eb176e32ffa', 'Vĩ', 10, false, 10370, 15000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('41688473-977e-4307-be2f-b609a9aa757d', 'fb83b932-bf61-447e-a616-2eb176e32ffa', 'Hộp', 100, false, 103700, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('ce42f2bf-2097-4ca9-a64b-7f02ce599a13', '0cf7b72d-18b1-49f1-93c6-97614397c84a', 'Vĩ', 10, false, 5350, 8000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('ede7c87e-6537-420d-9084-5d242fc37bbf', '0cf7b72d-18b1-49f1-93c6-97614397c84a', 'Hộp', 100, false, 53500, 80000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('7a4517d2-3e54-46ea-811f-c1fd0aff83bc', '255bb58d-6aed-4cc5-8920-fc7c268c3d20', 'Vĩ', 30, false, 34500, 37500, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('d224a068-c276-4926-8e1f-58d8ac2ea615', '255bb58d-6aed-4cc5-8920-fc7c268c3d20', 'Hộp', 60, false, 69000, 75000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('58ea7a0c-50b3-4a90-9999-d9543f8f979e', '66d9f32e-99b0-4fcf-9718-68e4d923e8b1', 'Vĩ', 30, false, 108000, 114000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('70334b3d-423d-4828-8161-80b3aa56d89d', '66d9f32e-99b0-4fcf-9718-68e4d923e8b1', 'Hộp', 60, false, 216000, 228000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('a55af771-4450-4c6a-bdef-e947fb0f764f', 'aa5e82e2-6357-4bbd-b45a-99f27aa1fd55', 'Vĩ', 10, false, 17400, 19000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('155d1fe7-5034-4ebe-8470-1428e1b1dc64', 'aa5e82e2-6357-4bbd-b45a-99f27aa1fd55', 'Hộp', 50, false, 87000, 95000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('28b4300d-2f33-4952-82e5-9f74e895e079', 'cb73ee00-9b79-475c-96f4-7993261eb3e3', 'Vĩ', 20, false, 68000, 70000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('a3eac16a-ad40-43fc-ae64-de9676eafaf7', 'cb73ee00-9b79-475c-96f4-7993261eb3e3', 'Hộp', 100, false, 340000, 350000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('aee5961d-01d9-44c5-ad46-7c096af16f2b', 'd37a1e1c-dd8d-4713-a836-ce4675dff1ff', 'vĩ', 10, false, 30000, 31000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('bdf7b01a-59f0-48bc-a635-969a91ffa902', 'd37a1e1c-dd8d-4713-a836-ce4675dff1ff', 'Hộp', 30, false, 90000, 93000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('f341f21c-d688-4bb8-ab98-5d7a22c5d9cf', '505410a1-a8c6-4736-9d5d-fcde6912d361', 'Vĩ', 10, false, 11330, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('d3256e73-b613-43c0-b985-e990ce601412', '505410a1-a8c6-4736-9d5d-fcde6912d361', 'Hộp', 30, false, 33990, 60000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('327348fa-044f-4919-816f-d83d187afd8a', 'c80c4aa0-39b6-4bf9-a816-b8bc650d3fd8', 'Vĩ', 10, false, 7880, 9000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('8936a629-a9a7-47c9-ab0b-a1f14f36eded', 'c80c4aa0-39b6-4bf9-a816-b8bc650d3fd8', 'Hộp', 50, false, 39400, 45000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('27af8a2a-0dbd-423e-9b63-987c9b0f30e2', '03350674-dd1f-486d-934a-1794f11c3cd5', 'Vĩ', 15, false, 21000, 24000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('bd0bb47f-ee4b-40bc-86d2-48399af7da54', '03350674-dd1f-486d-934a-1794f11c3cd5', 'Hộp', 30, false, 42000, 48000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('e028c5ef-e05d-46c1-bf9e-64eba37e64b7', 'b35a0827-df55-4eaa-9434-1eb97fd75f13', 'vĩ', 15, false, 23250, 25000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('5c9f5b16-f014-408f-8e16-eea6d0d4c390', 'b35a0827-df55-4eaa-9434-1eb97fd75f13', 'hộp', 30, false, 46500, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('5b2e20ca-abba-4ee3-bf25-adee733d1a2e', '2155068c-aec3-4dc5-ac6e-301457ec8a69', 'Vĩ', 10, false, 9000, 15000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('3222f6ed-63ba-4616-89d7-a3af82b6e351', '2155068c-aec3-4dc5-ac6e-301457ec8a69', 'Hộp', 30, false, 27000, 45000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('73fc77d3-ea07-47c2-b5b8-ad2e0811065a', 'a7cf4b70-73ef-499e-b75b-c1189c9e2e2d', 'Vĩ', 10, false, 6500, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('d780c68e-1ccc-4ddb-8467-1e3980ada5e8', 'a7cf4b70-73ef-499e-b75b-c1189c9e2e2d', 'Hộp', 100, false, 65000, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('9f71ae70-25e8-44a2-9189-c72d8fd15e66', '13fcf60f-5ecb-48ce-b762-fef63eb8fc05', 'Vĩ', 10, false, 5000, 7000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('deed26ad-36d1-487b-b408-cfeb710339cb', '13fcf60f-5ecb-48ce-b762-fef63eb8fc05', 'Hộp', 50, false, 25000, 35000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('def62bd1-8a16-4d76-a518-e05f2f8d0efd', '2b82552f-ed69-44ac-8129-bcc4527f0408', 'Vĩ', 25, false, 18100, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('5adbe38b-6eaf-4875-a074-1cb9a45f348c', '2b82552f-ed69-44ac-8129-bcc4527f0408', 'hộp', 100, false, 72400, 80000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('935d968d-e10b-408a-a6cb-7c51f3ef4358', 'fa31818c-36ee-4d10-ac77-1ebc009da3c9', 'Vĩ', 20, false, 6240, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('b2992b82-4c82-4c3b-9ab0-86961ec27971', 'fa31818c-36ee-4d10-ac77-1ebc009da3c9', 'Hộp', 100, false, 31200, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('20f5d07d-98e0-4a65-a4f4-fa13aaf5b4b4', 'eb5c0b02-5b45-4df7-b09f-23aab5877fe4', 'Vĩ', 10, false, 14000, 16000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('fd88d147-f3a6-4d2c-befb-8f850aa0d37d', 'eb5c0b02-5b45-4df7-b09f-23aab5877fe4', 'Hộp', 30, false, 42000, 48000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('3e7f180c-4955-4f3a-9299-12dba55ac9f4', 'ee6b02f3-dcfd-48dd-99ed-75a22b0e3aaa', 'Vĩ', 10, false, 10400, 15000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('3ec621fe-42f7-41d9-916d-735d2e0014d7', 'ee6b02f3-dcfd-48dd-99ed-75a22b0e3aaa', 'Hộp', 100, false, 104000, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('227bb340-3b1d-4900-ba97-2e4882501cfe', '156532a2-01e1-4ed6-b9b6-ec5c08b49f2a', 'Vỉ', 10, false, 45400, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('b6270ff9-d83f-4d71-84eb-058f446e6fb2', '156532a2-01e1-4ed6-b9b6-ec5c08b49f2a', 'Hộp', 30, false, 136200, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('da45ffcf-8669-4147-a90b-39734a1fab8f', '5042901d-118b-4b37-88ed-0075a58ee9f6', 'Vỉ', 10, false, 66000, 70000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('b0c8c66a-d500-404f-8e30-2d0a0d365ee7', '5042901d-118b-4b37-88ed-0075a58ee9f6', 'Hộp', 100, false, 660000, 700000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('b8b6ad4d-a649-4f4e-840d-909106e4bcbb', '0357351b-03ef-49f8-80ce-af5877bffef2', 'Vỉ', 10, false, 37500, 40000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('1c75916d-55ea-458b-9e02-8e570051fbf7', '0357351b-03ef-49f8-80ce-af5877bffef2', 'Hộp', 100, false, 375000, 400000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('c455977a-c8f6-4dc4-a610-faa0c6182517', '5bf46c6d-efd6-4b85-bf26-02d78309b61f', 'Hộp', 100, false, 70000, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('88926569-264a-4fbf-8ec1-36751026fbbd', '5bf46c6d-efd6-4b85-bf26-02d78309b61f', 'Vỉ', 10, false, 7000, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('e799d92f-cca5-4183-b474-b66350e48d1b', '7ef940c0-0068-44bc-83d3-02db89f06cac', 'Hộp', 100, false, 152000, 200000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('04710dac-470e-46dd-bb0b-b9762b490eea', '7ef940c0-0068-44bc-83d3-02db89f06cac', 'Vỉ', 10, false, 15200, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('a5dac480-b3e0-49e4-bfcd-eaa93072fd40', '27201186-3b4e-45ca-97ee-23611e68fbf0', 'Vĩ', 10, false, 6800, 8000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('79cda309-989c-4b35-aa6d-3b396affa60b', '27201186-3b4e-45ca-97ee-23611e68fbf0', 'Hộp', 30, false, 20400, 24000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('93a20ead-0dd1-4ed3-82b8-ebc69bee0756', 'a7f0cd3c-0392-410f-ba72-120f4ad095a9', 'Hộp', 40, false, 160000, 180000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('fd3b3794-e0f8-4e79-8018-e24284c9d059', '40ac1dbb-ead0-4249-838b-8a05b437dd0a', 'vĩ', 14, false, 71890, 75000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('309da00c-40df-4465-af3d-84c64cbcd70d', '40ac1dbb-ead0-4249-838b-8a05b437dd0a', 'Hộp', 14, false, 71890, 75000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('4ba868cb-4e40-49ab-9354-407a65a03533', '272de060-3ae8-40b6-9115-84de4dd330d1', 'Hộp', 10, false, 42000, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('a3eb8d1e-c012-4332-8d3a-9d8cc92c1e3e', 'a7db1464-2255-4b12-af26-60a71df5d763', 'Hộp', 100, false, 150000, 120000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('e35e5db5-1ec5-412b-8335-87a47b02afc7', '6aa9f5db-5385-45f3-980c-7bed62d27709', 'vỉ', 10, false, 8000, 12000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('d166fd96-6a33-4d5b-a706-ed29624d9479', '6aa9f5db-5385-45f3-980c-7bed62d27709', 'Hộp', 100, false, 80000, 120000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('8e436d02-669e-4416-9c50-9d26ad970ca9', 'd0adb5fe-b03f-4f7c-a9f6-2b5b55d1e762', 'Vỉ', 20, false, 6500, 8000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('0cf25881-c2b9-4176-b94c-8995744327bb', 'd0adb5fe-b03f-4f7c-a9f6-2b5b55d1e762', 'Hộp', 100, false, 32500, 40000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('f1d2aa16-072e-46ea-b49f-00293a196c09', '81796b73-86de-4963-bb32-59f854cd9b52', 'Vỉ', 10, false, 43900, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('60b80756-8ccf-4ebc-8948-4e236379efa3', '81796b73-86de-4963-bb32-59f854cd9b52', 'Hộp', 30, false, 131700, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('06c51e9e-1f8e-413b-9da2-c56be2b9a9f7', 'b7c6373f-1965-4a4c-ab0d-f29aa1ac1a15', 'Hộp', 20, false, 225700, 250000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('6a226b61-8077-4193-80f9-babe20d4a0ee', '6145cd9a-9148-4870-95c4-a0b77c443be1', 'Hộp', 10, false, 70000, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('1ecf6ed3-02fb-4a5c-9dc8-20f129201c0b', '5e8e2f46-59fe-41ba-8788-abc0c3dcc09b', 'Hộp', 4, false, 32000, 120000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('9633f1ca-f0b7-407e-b3fe-7b82500db9b3', '621f75cd-9f18-4353-aad6-2f1283e5b6e7', 'Tuýp', 10, false, 70000, 75000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('036b8333-ca7b-4ac2-9406-5d943b287b3f', 'e0e0b301-347e-4b32-817c-ece7f20a062a', 'Hộp', 30, false, 8865000, 340000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('1613ec1f-5c04-4c3d-adff-98c0d1005bfa', 'dfea4715-3a9b-4e23-ac28-03f3f23776f0', 'Vỉ', 10, false, 5000, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('e3ca7733-8906-474a-ae87-1b6abd03337a', 'dfea4715-3a9b-4e23-ac28-03f3f23776f0', 'Hộp', 100, false, 50000, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('a275325e-ce6b-4462-9a3d-fabf3d08ff0c', '5495a819-13d4-41a1-ba05-83a40ccf165e', 'Vỉ', 10, false, 12930, 17000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('ec7c361b-8773-4ef7-86fb-a3641cc537c0', '5495a819-13d4-41a1-ba05-83a40ccf165e', 'Hộp', 30, false, 38790, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('55f688ff-1c2a-4226-b145-235f52a8ef77', 'e7db1da8-fb68-4027-b519-578a241ca92d', 'Hộp', 20, false, 26200, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('78c6e7f4-6fd9-45b2-a208-285e99fc0068', '4db2c705-138b-4dab-84fe-d666895e9fda', 'Hộp', 30, false, 55500, 90000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('bcdba99e-4050-4984-a5e1-24c520575213', 'efaf12f7-28e5-4463-a4c6-56c031d826cb', 'Vỉ', 10, false, 2500, 5000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('6ae1e82c-f9b1-4fa7-904f-d29674f82496', 'efaf12f7-28e5-4463-a4c6-56c031d826cb', 'Hộp', 30, false, 7500, 15000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('67bd9f5b-afbb-4a3a-a634-15504e1ae45d', '13018379-1115-4bed-a6fe-bad595f54a61', 'Vỉ', 10, false, 2100, 5000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('d262da6e-b62d-45e3-8bf1-478c8ac55e11', '13018379-1115-4bed-a6fe-bad595f54a61', 'Hộp', 100, false, 21000, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('315d0392-ee14-4c35-9a26-4f657968559f', '8f47a4f9-b210-4e40-aeb9-afb9e540f3d7', 'Vỉ', 25, false, 9750, 15000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('fa4f7620-9dad-4281-a405-64bcda49a2bd', '8f47a4f9-b210-4e40-aeb9-afb9e540f3d7', 'Hộp', 50, false, 19500, 30000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('d94a1c09-0881-41ca-bc69-ec788842bbc8', 'fa7ed0ba-204f-4ef7-a175-f40c6bc5476f', 'Vỉ', 10, false, 2510, 5000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('70bd189f-058d-4535-ae28-ef48ebd4ef0b', 'fa7ed0ba-204f-4ef7-a175-f40c6bc5476f', 'Hộp', 100, false, 25100, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('cac77d29-2a71-411a-8047-03712506a31e', '46fe8513-669f-4c75-981a-656ece032aee', 'Vỉ', 10, false, 24800, 26000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('52a463a3-586d-4f60-b396-207a1ed24cea', '46fe8513-669f-4c75-981a-656ece032aee', 'Hộp', 20, false, 49600, 52000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('b87805a5-0311-40e8-9b3a-1c99d6747bae', 'e8776ffe-5c52-44c5-90c7-1adbc0fad6b5', 'Vỉ', 10, false, 13650, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('8a7d7170-2a9e-49ef-98da-c69c4300a1a4', 'e8776ffe-5c52-44c5-90c7-1adbc0fad6b5', 'Hộp', 20, false, 27300, 40000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('deffa17d-f1bf-4518-a5a9-5b2d060268a1', '157c13e0-ab5b-4a0c-a87c-5a3e0ae5d37f', 'Hộp', 10, false, 46000, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('e198b027-7481-4b65-9c5b-da18b53f645d', '5c1fad2c-9487-438b-9d90-d73e5b9a2060', 'Hộp', 20, false, 164000, 180000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('dd221b44-0dba-4c5e-b392-b3a12496887a', 'faa7ee84-31f7-4186-88b6-6fda021ce069', 'Vỉ', 10, false, 5920, 7000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('9e0493d2-a3e4-4b8a-ae66-856985f1a7a1', 'faa7ee84-31f7-4186-88b6-6fda021ce069', 'Hộp', 50, false, 29600, 35000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('0bb9d143-1d18-4f9b-a057-6d46f5794c21', '7f7b51a3-0e27-4e39-8799-9c07ffdf2ef1', 'Vỉ', 20, false, 1340, 3000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('128ccb10-c2cc-41e7-80da-a4dd43070f27', '7f7b51a3-0e27-4e39-8799-9c07ffdf2ef1', 'Hộp', 200, false, 13400, 30000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('61f7e2ca-86ac-449f-a2b4-1b2a709b07ca', '47e6c130-783d-443b-8d7c-24147b243b56', 'Hộp', 20, false, 82000, 120000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('ec00188b-9643-44e8-8340-b1196c24b35e', 'd810bd58-09c4-48e4-b401-3c6a9c6a94f9', 'Vỉ', 10, false, 7340, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('5bd352ee-13fe-482f-8b5d-c6f830b750f1', 'd810bd58-09c4-48e4-b401-3c6a9c6a94f9', 'Hộp', 100, false, 73400, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('8247533e-4cd1-4213-9178-88133cdd2098', 'bc497459-83c7-46b1-b4f8-d7945b768027', 'Vỉ', 10, false, 28500, 32000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('b4283d3d-a104-4dff-81a9-281c2e5a3291', 'bc497459-83c7-46b1-b4f8-d7945b768027', 'Hộp', 20, false, 57000, 64000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('ddb37535-cc06-4718-8af1-ffb0f2fdd53d', '71111dd6-7755-4837-b797-bd4d1c311619', 'Vỉ', 10, false, 0, 6000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('98566b33-5459-400b-ab0e-d91337720e26', '71111dd6-7755-4837-b797-bd4d1c311619', 'Hộp', 100, false, 0, 60000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('e0e3f2af-4126-40c7-a732-f287b75f1c46', 'f20e46f5-fb50-4d66-9a55-0fb1c177eeee', 'Vỉ', 10, false, 16670, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('13ea8560-985b-442b-9e58-9513cea88111', 'f20e46f5-fb50-4d66-9a55-0fb1c177eeee', 'Hộp', 100, false, 166700, 200000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('98429c84-9241-4116-a04c-0344e86c32de', 'f133e51d-4d29-4b55-8eb4-560abeaaab18', 'Vỉ', 10, false, 2000, 5000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('19cd6109-bb91-4c11-b420-a4d7817b73db', 'f133e51d-4d29-4b55-8eb4-560abeaaab18', 'Hộp', 50, false, 10000, 25000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('8c959e39-4c1a-4313-87da-db78d261232e', '7f7c6fd0-513f-417b-bdff-9e953a608525', 'Hộp', 20, false, 136700, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('fc678ec1-e7e6-42f5-bc12-2dffbc4359c5', 'c5147b89-7e4a-49da-9989-6c4f093a2b53', 'Vỉ', 10, false, 2200, 5000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('10156a88-57d6-41c9-9238-7195f9e0aa9c', 'c5147b89-7e4a-49da-9989-6c4f093a2b53', 'Hộp', 100, false, 22000, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('ea490058-3a31-4aec-845f-f435aabb6e3c', '35688da8-1943-4c88-a208-3d495013f6b4', 'Vỉ', 25, false, 4600, 6250, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('a84e8800-6dfc-450f-b76c-7c48bc0e9392', '35688da8-1943-4c88-a208-3d495013f6b4', 'Hộp', 250, false, 46000, 62500, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('d7dc5dd6-a7aa-48c4-ae3e-e2434c1290a8', '7bb65f58-0c02-42d7-b87b-53d01a21b61c', 'Hộp', 20, false, 22100, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('a7877129-eeaa-44ee-8bc3-bbc72e797fd1', '4cda267a-301e-4651-b78d-6fde5ee57eb2', 'Vỉ', 10, false, 7267, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('dd1d26cf-9a66-4e59-90a1-0a1f599674a6', '4cda267a-301e-4651-b78d-6fde5ee57eb2', 'Hộp', 30, false, 21801, 30000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('50c71e2d-c600-4f78-ad73-469b6a390b70', '80bace75-b9be-440d-8f4c-a317d474665f', 'Vỉ', 4, false, 14532, 16000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('325e55e7-11bc-4c4f-b077-4df1f8f943e6', '80bace75-b9be-440d-8f4c-a317d474665f', 'Hộp', 48, false, 174384, 192000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('3d4c8954-176a-4dd8-8a6e-22c6c869546f', '639babe9-5b62-4437-b181-9160cbb9430e', 'Vỉ', 10, false, 3290, 5000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('8af1b4d3-898d-4460-ae07-6dc76d5fce25', '639babe9-5b62-4437-b181-9160cbb9430e', 'Hộp', 100, false, 32900, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('6d6f7131-e413-47a5-a86a-0bdbffa57c43', 'e00a10e7-0684-48d3-96a4-e4e6c074ad23', 'Vỉ', 4, false, 11872, 16000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('cff1144e-0211-46f0-92b1-207c9d94f370', 'e00a10e7-0684-48d3-96a4-e4e6c074ad23', 'Hộp', 80, false, 237440, 320000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('493329b6-0c7b-4427-8a04-9429091a0538', '4281e779-c119-41ad-968d-4c44d14d27f5', 'Vỉ', 10, false, 2060, 5000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('67b991c8-880b-4181-a805-cde4df44fa2d', '4281e779-c119-41ad-968d-4c44d14d27f5', 'Hộp', 100, false, 20600, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('9175296f-3b51-4207-8287-22cc4233b011', '519abd5f-d630-47bd-b05b-7c07cfa785c4', 'Vỉ', 10, false, 7430, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('41eb8d0a-d566-4894-8a7a-2bcd4ea52840', '519abd5f-d630-47bd-b05b-7c07cfa785c4', 'Hộp', 250, false, 185750, 250000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('2dbb792a-8383-4853-94ff-70e2d3686bca', '8a9690a2-2ac4-448c-ad28-d68e73b6137d', 'Hộp', 20, false, 60000, 120000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('1f1aefa6-ff2b-4294-83e2-b3ae377b7efb', 'db0de0e6-26dc-4b44-ac30-e188d13cf95d', 'Vỉ', 10, false, 8900, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('08882866-fe93-4a4d-9307-6fb9be23f0de', 'db0de0e6-26dc-4b44-ac30-e188d13cf95d', 'Hộp', 100, false, 89000, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('f83bb955-34c0-40b5-831d-636a97c9fa12', '64a3f101-16c8-4c67-aa08-5c02e50715fe', 'Vỉ', 10, false, 4250, 15000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('cb4a0174-0f15-4b1c-866d-449d920086ec', '64a3f101-16c8-4c67-aa08-5c02e50715fe', 'Hộp', 20, false, 8500, 30000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('6aba52b6-abaa-490a-b405-9d351425306b', '67136254-f331-42be-981b-e5eadacc39bf', 'Vỉ', 10, false, 8310, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('408375d9-0db8-4e3a-8b66-d1ee5148c498', '67136254-f331-42be-981b-e5eadacc39bf', 'Hộp', 50, false, 41550, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('a5dd78c1-f6b7-4bdc-8cc5-b1d29215e012', '5f572558-688c-49b5-b04f-6420fb23ba1f', 'Vỉ', 10, false, 8000, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('2cb37dcb-3734-498b-8a62-783328693c08', '5f572558-688c-49b5-b04f-6420fb23ba1f', 'Hộp', 100, false, 80000, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('17e16b06-88d7-4966-b293-bbedc3da24db', '52a1fed5-562e-400a-b8b4-3a7856b13986', 'Vỉ', 20, false, 3560, 5000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('ea3dc4f3-9d27-4093-a51b-aab1e47e0093', '52a1fed5-562e-400a-b8b4-3a7856b13986', 'Hộp', 100, false, 17800, 25000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('0d84fbb0-5cc7-48bc-80aa-14876465e982', '89a592c6-a5bf-4ad7-85e6-a6f16793d1a7', 'Vỉ', 10, false, 23800, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('92314a33-0d4d-45db-bb09-903b504f1eb0', '89a592c6-a5bf-4ad7-85e6-a6f16793d1a7', 'Hộp', 10, false, 23800, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('b0091166-bf94-4398-9393-d3339a4469f9', 'b7250203-2d29-49ea-838a-2740f415b33e', 'Vỉ', 10, false, 19380, 21000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('fc3e1bbc-83c3-411c-8cc4-e6c1f0904c3b', 'b7250203-2d29-49ea-838a-2740f415b33e', 'Hộp', 50, false, 96900, 105000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('1288cb34-8401-4f43-aee9-e0ca0b4f3262', 'a36f4390-7b30-4770-9164-dc4fb0c3897d', 'Vỉ', 20, false, 76660, 80000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('e1dcd5cf-c8bb-45f3-b70c-f101ce7a38bb', 'a36f4390-7b30-4770-9164-dc4fb0c3897d', 'Hộp', 60, false, 229980, 240000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('66d19a7f-b85d-48f9-b85f-86d5e35fb897', 'acc44118-098d-48cd-a7cc-7fdbcc808d26', 'Vỉ', 10, false, 57000, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('573fff7b-391c-4a97-8e1f-624b5d6c3fce', 'acc44118-098d-48cd-a7cc-7fdbcc808d26', 'Hộp', 30, false, 171000, 450000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('0f19c18b-c515-42ca-8b9a-017eda5505c6', 'e13e8569-3a22-455f-ada9-c33a83456bff', 'Vỉ', 10, false, 40000, 43330, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('b79b596e-c9b6-4397-9af9-90ef1a47e636', 'e13e8569-3a22-455f-ada9-c33a83456bff', 'Hộp', 30, false, 120000, 130000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('d3ad1b30-7d5d-42a5-866f-1ac153ca2e1b', '310d14ea-7b54-4d0b-b420-5c287b07f448', 'Vỉ', 10, false, 63000, 75000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('5a1eb683-0ee1-49a2-ad46-7a9a03c04a7f', '310d14ea-7b54-4d0b-b420-5c287b07f448', 'Hộp', 10, false, 63000, 75000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('52d61f72-51b0-4d81-9e36-39d5a2d057dd', 'dadefabb-b912-4e7c-8a2f-5458f484b4c6', 'Vỉ', 10, false, 8350, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('c4a3bbc0-cb14-4f8e-8b05-b713760cf5b6', 'dadefabb-b912-4e7c-8a2f-5458f484b4c6', 'Hộp', 100, false, 83500, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('77b06a16-a869-4cb3-bcb1-5b8e4c3443d2', 'af0d126e-b15e-4a65-8862-b764f86a0a23', 'Vỉ', 12, false, 15324, 16000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('0bfe9777-3e7b-43bc-aa98-2736ac2953a2', 'af0d126e-b15e-4a65-8862-b764f86a0a23', 'Hộp', 180, false, 229860, 240000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('01650903-f322-46d9-b4e1-d32371f8eda2', 'c5c8c9bd-2680-441b-a60c-ba56d7bfbe09', 'Vỉ', 12, false, 10500, 12000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('8fca6c37-5477-4f69-8edc-0dc054a5ceaa', 'c5c8c9bd-2680-441b-a60c-ba56d7bfbe09', 'Hộp', 120, false, 105000, 120000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('d3f3aedd-e427-4d1d-9c59-ccfb507588d1', '2ab8342f-ce6b-43d8-85a1-9e88f2a0a0f7', 'Vỉ', 10, false, 9600, 13000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('1c2b2000-5bf2-4aa4-84b7-da7d6c2ab69a', '2ab8342f-ce6b-43d8-85a1-9e88f2a0a0f7', 'Hộp', 30, false, 28800, 39000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('2410f04e-5732-420c-97d5-605dc0497387', '9d68ded5-2b6e-484f-8fe8-4fada8c8010a', 'Vỉ', 10, false, 2360, 4000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('f3218b1d-383e-4e73-965f-9ae58ad47da9', '9d68ded5-2b6e-484f-8fe8-4fada8c8010a', 'Hộp', 100, false, 23600, 40000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('cb37f9f0-2cae-49bd-b8e5-05bf41b6e1b2', 'ce3c4584-f8a2-494b-b6aa-9df053336a38', 'Vỉ', 30, false, 90000, 93000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('16ec700e-6cd7-4bd8-9cc4-28da62c5d37c', 'ce3c4584-f8a2-494b-b6aa-9df053336a38', 'Hộp', 60, false, 180000, 186000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('e7753a8a-630f-4354-9d95-dd640399961f', 'c03a60a5-1e52-4689-8455-990f437286e4', 'Vỉ', 10, false, 7370, 8000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('c33118ed-85d0-40bd-bd72-d7de3e11f30c', 'c03a60a5-1e52-4689-8455-990f437286e4', 'Hộp', 30, false, 22110, 24000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('54b8615b-00a6-4c71-bb66-ef7912361c0b', 'ca922e06-0a9a-49e7-8eac-a1d546c6eb46', 'Vỉ', 10, false, 22620, 25000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('8f12240b-1ea5-4441-a3c8-d2831ed85647', 'ca922e06-0a9a-49e7-8eac-a1d546c6eb46', 'Hộp', 100, false, 226200, 250000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('b1bceb31-300e-4faf-abf1-69f8fb9ef88b', '57920e19-7634-4a42-85e8-76c723285060', 'Vỉ', 10, false, 7130, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('728f4a4f-b8a4-4a79-8f2e-d3a8fa560ad7', '57920e19-7634-4a42-85e8-76c723285060', 'Hộp', 30, false, 21390, 30000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('f342e9b8-1313-4607-af92-cc3d3a6e8907', 'd64f086e-da35-48b7-84de-40df33bfb199', 'Lọ', 30, false, 204000, 210000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('0b052075-795f-404c-ba09-dd5138d059d3', 'c3ff1387-e69f-4b6f-aed7-e39becec2e14', 'Vỉ', 10, false, 32300, 35000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('df68f75c-8cb5-411b-8049-c0a85f8754a1', 'c3ff1387-e69f-4b6f-aed7-e39becec2e14', 'Hộp', 30, false, 96900, 105000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('94ddaaac-57b9-4e62-b008-eacf123c5690', '87e8ed36-3763-49a2-84a2-955ac4a9a73c', 'Vỉ', 10, false, 21000, 25000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('c72b4684-7865-4eca-873c-a73610264dd3', '87e8ed36-3763-49a2-84a2-955ac4a9a73c', 'Hộp', 30, false, 63000, 75000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('8bb9bc3d-e372-4abb-9b94-d2eaaea300c2', 'd70d10c3-40c1-4874-a2ad-418b0b0e3241', 'Vỉ', 10, false, 11000, 12000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('20c5cafd-c157-42de-9019-4ef0d0aa87da', 'd70d10c3-40c1-4874-a2ad-418b0b0e3241', 'Hộp', 50, false, 55000, 60000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('b0f058fe-b3dc-4bae-8a0c-b1c3c4e7626e', '07e3d548-4e49-4832-8be6-f1a946d3b897', 'Vỉ', 10, false, 6610, 7000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('545d272e-a85e-4871-b14d-099e3804a267', '07e3d548-4e49-4832-8be6-f1a946d3b897', 'Hộp', 100, false, 66100, 70000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('cbbcf32a-93d2-40b2-827f-f048679e9cb2', '26396b4d-152f-4b81-9830-548769bfed2d', 'Vỉ', 15, false, 67500, 72000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('e39d5b1d-aeb8-4d08-b7f4-753b50a0d98e', '26396b4d-152f-4b81-9830-548769bfed2d', 'Hộp', 60, false, 270000, 288000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('30bbd883-6aeb-4cd8-a8e2-7f2ed4b0d4b3', 'cf13315f-caf5-4ff5-95a7-764e4cd34263', 'Vỉ', 14, false, 116200, 125000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('8b24ea13-40bb-4787-928c-7d064f0cbe7b', 'cf13315f-caf5-4ff5-95a7-764e4cd34263', 'Hộp', 28, false, 232400, 250000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('8c8bf6c6-3391-49b3-bfbe-59c92c304fcd', '930ee7cd-0305-4ec4-ac2d-f6a433c711f5', 'Vỉ', 10, false, 106000, 15000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('0a9ca22c-1106-45c4-8669-8c20e65c361f', '930ee7cd-0305-4ec4-ac2d-f6a433c711f5', 'Hộp', 60, false, 636000, 90000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('40bdd12b-19be-4850-b4b7-a043bcef24f5', '879f8abb-d3a0-45b8-84a4-ff8d57ce75cd', 'Vỉ', 10, false, 0, 28300, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('09f2b8da-d1f6-49ee-981c-c43690ca3b6a', '879f8abb-d3a0-45b8-84a4-ff8d57ce75cd', 'Hỗp', 30, false, 0, 85000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('fc62e7d7-4968-4307-ab04-7b997d910e86', '4396d24c-b6b5-49d4-a50e-e4676a03a995', 'Vỉ', 10, false, 0, 60000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('4861a438-4447-420e-9377-30dc001be123', '4396d24c-b6b5-49d4-a50e-e4676a03a995', 'Hộp', 30, false, 0, 180000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('086b9f00-f3f6-4f52-9e2d-0b86ffce415e', 'b4a2ba5e-7657-4fbb-a6e5-8512d20fcdff', 'Vỉ', 10, false, 14550, 17000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('84a8700f-db45-490b-939b-984f738ba4fc', 'b4a2ba5e-7657-4fbb-a6e5-8512d20fcdff', 'Hộp', 100, false, 145500, 170000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('5d3dae6e-e597-435a-9bb2-f5fe46af45d4', '688f2e8e-8b99-4c2f-9675-225f02ff83f4', 'Vỉ', 10, false, 24100, 25000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('7a29ff3a-6b31-4c64-bc13-b3a09933b426', '688f2e8e-8b99-4c2f-9675-225f02ff83f4', 'Hộp', 30, false, 72300, 75000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('f1f6c7ae-8d26-4444-b9d1-d7594b0d7a95', 'f17c2422-e2f8-4f0d-999e-295f5b520e45', 'Vỉ', 10, false, 5500, 6000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('fdd49221-f28e-4588-a214-8b361c0b497c', 'f17c2422-e2f8-4f0d-999e-295f5b520e45', 'Hộp', 100, false, 55000, 60000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('cb5d4030-0cf3-4b0a-88be-ab3f4333e09c', '753bd598-5552-4b68-8ebb-6805cff58453', 'Vỉ', 10, false, 27800, 40000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('b5b4d387-836e-44f6-89e9-d882daddede9', '753bd598-5552-4b68-8ebb-6805cff58453', 'Hộp', 30, false, 83400, 120000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('774c063d-3383-4d23-8f29-2810741566e5', 'd4352042-ee5a-4901-b30d-2716dfeec617', 'Vỉ', 30, false, 34410, 39000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('68c72c69-441a-40a9-833d-e8e633680112', 'd4352042-ee5a-4901-b30d-2716dfeec617', 'Hộp', 90, false, 103230, 117000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('59856f15-8c47-40fd-8050-097a68319b62', 'bdc9f68d-8972-4364-9705-483b1bb18aa8', 'Vỉ', 10, false, 22430, 26000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('d8044950-c946-45dc-94db-ee8d1b8bf9c0', 'bdc9f68d-8972-4364-9705-483b1bb18aa8', 'Hộp', 30, false, 67290, 78000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('040afec2-7ac6-4904-a261-c42438e89060', 'e5a22ed0-a9c2-4765-9fac-adde1cfcf58b', 'Vỉ', 30, false, 8190, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('daa5dd60-66ff-4b87-9f36-d508e41fc1ba', 'e5a22ed0-a9c2-4765-9fac-adde1cfcf58b', 'Hộp', 60, false, 16380, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('4c4946c3-b97e-4db8-b36e-196860e2f473', '1ddb8763-51fe-4024-ba55-4ed7d6d4f0dc', 'Lọ', 30, false, 250410, 270000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('84e22b12-fd4a-48e0-b2c5-8ac931689b99', 'a106d173-0251-4d5a-b22f-37fbf24bb806', 'Vỉ', 10, false, 5400, 6000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('c601ac2f-8f59-4b7f-8bc6-f87b0cb13a0d', 'a106d173-0251-4d5a-b22f-37fbf24bb806', 'Hộp', 100, false, 54000, 60000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('15365fc4-14d8-4ea5-8606-d8d4b12971a3', '91fe3d68-c1b0-4d3f-81d8-05e9b212daba', 'Vỉ', 10, false, 2700, 4000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('03835e85-b6b0-447f-bb1f-bb3086616771', '91fe3d68-c1b0-4d3f-81d8-05e9b212daba', 'Hộp', 100, false, 27000, 40000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('d5b303be-d972-4828-9c39-dbfd707a6259', '6a35247c-3406-4737-900f-d3b4198111ff', 'Vỉ', 10, false, 3280, 7500, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('09932544-7b64-4923-aff6-db864302730c', '6a35247c-3406-4737-900f-d3b4198111ff', 'Hộp', 20, false, 6560, 15000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('a41f9a53-2bce-40b1-8e7c-8d93ee495295', 'c92a26af-e909-4f2b-a61e-4bac46c2f792', 'Hộp', 30, false, 245490, 255000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('661a197e-a0c1-4b94-a371-1690d53d5143', '52ff9e00-f8f0-4d5b-b473-96749815e216', 'Vỉ', 10, false, 20550, 25000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('24f8b5f4-c3d1-4b14-9c7c-5816ef2ad42c', '52ff9e00-f8f0-4d5b-b473-96749815e216', 'Hộp', 60, false, 123300, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('399daf6a-4361-4e0e-baf5-f7dd9354a8d2', 'a654fb42-6754-4de0-8b3c-e082d7df8769', 'Vỉ', 10, false, 5500, 7000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('d2895cb9-4fbe-4d00-819c-3f4856deb8fe', 'a654fb42-6754-4de0-8b3c-e082d7df8769', 'Hộp', 100, false, 55000, 70000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('bed71934-7535-419e-8d46-e37a0945dcdf', '141d2295-5aa7-4e0b-8f1f-1a0bd52dd855', 'Vỉ', 10, false, 36430, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('3613138f-e7e9-468a-af71-6734f7a86cf0', '141d2295-5aa7-4e0b-8f1f-1a0bd52dd855', 'Hộp', 100, false, 364300, 500000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('35b1db9f-aebd-481d-a94c-8f2c029940e3', '3dd9bc60-a1e6-4e93-b787-57573afb2d62', 'Vỉ', 10, false, 20770, 24000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('c9bd73dc-177e-47ce-a661-ff9f839b7672', '3dd9bc60-a1e6-4e93-b787-57573afb2d62', 'Hộp', 100, false, 207700, 240000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('a7a8da0f-7485-42e0-8729-336d610d981b', '9ae85c21-ae38-484b-b6f0-3c485ec57871', 'Vỉ', 15, false, 11700, 15000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('b7b66897-0c2a-4bf2-9810-53a19eabdd9e', '9ae85c21-ae38-484b-b6f0-3c485ec57871', 'Hộp', 30, false, 23400, 30000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('31902120-f87d-466d-9a89-0287c8b5276d', '69f04f21-c77e-40ec-a665-f415afc95eaa', 'Vỉ', 10, false, 8500, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('c08336b7-e066-4a0a-892d-da277b198437', '69f04f21-c77e-40ec-a665-f415afc95eaa', 'Hộp', 10, false, 8500, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('aacfb8e7-9201-4f3d-89a1-72e7b66be7c8', '647dff83-727f-47c1-8cfd-e958ad65b3a0', 'Vỉ', 10, false, 14140, 16000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('a34e5ace-6899-4b1c-ad63-790c1b05c4bd', '647dff83-727f-47c1-8cfd-e958ad65b3a0', 'Hộp', 50, false, 70700, 80000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('c83f543f-b985-45dc-a91c-9cb57403c6e3', '1b52850b-d86e-40d2-96f6-86290b699c86', 'Hộp', 90, false, 151290, 180000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('da621e2e-6f55-47a4-98da-4c3ac72444f6', '1b52850b-d86e-40d2-96f6-86290b699c86', 'Vỉ', 30, false, 50430, 60000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('af61f63b-7861-44ae-b78d-c50fe41221a4', 'a1901543-e360-418c-a742-8d19bf0e7975', 'Vỉ', 10, false, 7270, 9000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('82cd4fd8-0dfc-4f2a-8d69-0c8ff7537c74', 'a1901543-e360-418c-a742-8d19bf0e7975', 'Hộp', 100, false, 72700, 90000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('f96cccc6-193f-4c39-9719-8fa4aac9994a', '1c3ddf43-ca0e-439c-b98c-edcc86f88b07', 'Vỉ', 15, false, 26910, 30000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('cbdbba1e-df22-4424-a6e0-8f4c7014b121', '1c3ddf43-ca0e-439c-b98c-edcc86f88b07', 'Hộp', 60, false, 107640, 120000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('2ab829ab-a2b3-4284-9bfc-807337338aaf', 'a321e7fb-aff2-409a-a035-f83399ff30e0', 'Vỉ', 14, false, 147000, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('b653a66d-fc2d-4a3d-b64f-dc1aa7541a4c', 'a321e7fb-aff2-409a-a035-f83399ff30e0', 'Hộp', 28, false, 294000, 300000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('90ca26c3-127f-4067-abda-e56d22e32d51', 'bfb23ae0-10c8-4a62-ae44-0c10792e8cda', 'Vỉ', 10, false, 25630, 27000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('4a195da5-6cc3-40a9-9642-9528bc8ecf6e', 'bfb23ae0-10c8-4a62-ae44-0c10792e8cda', 'Hộp', 30, false, 76890, 81000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('23cd5e2b-218c-4457-ac90-9fdebecd65db', 'ffe65088-5d4b-4fdf-b8a8-7a6988f6e6e1', 'Vỉ', 10, false, 13330, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('dd6a46e2-38da-48e3-ad1f-d4af420e7c0a', 'ffe65088-5d4b-4fdf-b8a8-7a6988f6e6e1', 'Hộp', 30, false, 39990, 60000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('afa844c8-0430-4293-80b2-4a9cabf51a0d', '13d3176b-3c8a-4119-8045-315c6a3f5701', 'Hộp', 50, false, 176000, 250000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('c109d78f-0530-4809-8699-a07b3c3e383a', '8da270a6-c8bd-436b-adcf-36aba8985361', 'Hộp', 100, false, 352000, 500000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('ea1cb262-0689-48f7-9bc9-92e292a74286', 'a5459567-65eb-4bbf-bbd0-040413ec22be', 'Vỉ', 12, false, 16992, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('1429dd9d-387b-410d-ac2d-91dd767978cf', 'a5459567-65eb-4bbf-bbd0-040413ec22be', 'Hộp', 24, false, 33984, 40000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('32596cfa-2cd8-4ff9-9460-2265d730dc67', 'de0f7966-2efc-4b2b-ad3d-34cca1169e70', 'Vỉ', 12, false, 16992, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('aae2f4ae-c679-407b-befd-ff632a59742a', 'de0f7966-2efc-4b2b-ad3d-34cca1169e70', 'Hộp', 24, false, 33984, 40000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('dd68d839-e7c8-45d0-99ae-392307bbfe41', '9292733c-5158-4c6b-b2f2-b05759d45e6d', 'Vỉ', 12, false, 16992, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('35812065-d15b-43b6-85c1-0fb1f08933a9', '9292733c-5158-4c6b-b2f2-b05759d45e6d', 'Hộp', 24, false, 33984, 40000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('6bf87e8b-1851-46b2-b04e-e94aebf318c7', 'fa82a6ce-dd02-4a00-a4ec-089445e46de4', 'Hộp', 100, false, 55000, 75000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('77f81d93-b964-453a-b96c-69545bbd2bef', '304a2ad8-5520-4511-9375-691e3f3f7623', 'Hộp', 100, false, 50000, 67000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('c1b124e9-fba5-4838-97a2-eadc299bc223', '2062470d-f7e0-4276-812e-8a5ccdaa277a', 'Vỉ', 10, false, 35000, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('14cb8131-c05a-4194-a1fc-fd097736639a', '2062470d-f7e0-4276-812e-8a5ccdaa277a', 'Hộp', 30, false, 105000, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('5af710a2-c777-41e9-b2d7-7fedc2b8fc3c', 'e773a4c6-d19c-43fc-ae63-6cce40a04718', 'Vỉ', 10, false, 11000, 15000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('6eea3d65-feec-4e7c-b487-88e35b69727a', 'e773a4c6-d19c-43fc-ae63-6cce40a04718', 'Hộp', 100, false, 110000, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('7b05ce58-ecf7-4e17-850f-014967aeb97d', '46ebfd6e-0abe-4138-a2be-90629f290fbc', 'Vỉ', 10, false, 8400, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('7ee5c02d-1f81-40fc-a41e-385ae450bd48', '46ebfd6e-0abe-4138-a2be-90629f290fbc', 'Hộp', 20, false, 16800, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('f607c90d-1bfa-4e26-9286-c276beb5ecb3', 'bd7df27d-4564-4046-92f0-875abef38785', 'Vỉ', 10, false, 48330, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('c1ad68a0-bfc5-4a37-88f2-7b74ea97aac1', 'bd7df27d-4564-4046-92f0-875abef38785', 'Hộp', 30, false, 144990, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('0ae8898a-5d99-4f72-b6d4-b90fb8f75a28', '963e867a-d9d8-40fc-a5b5-57ac3caa6ea1', 'Vỉ', 10, false, 20000, 25000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('7bf6e90f-9a5b-44bc-8c14-3f30ba4e5842', '963e867a-d9d8-40fc-a5b5-57ac3caa6ea1', 'Hộp', 30, false, 60000, 75000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('c7b8dfe4-2d2c-473d-a386-6c4d333f42d0', '5d4ee24e-c255-4e0f-840d-7a057f51c5e5', 'Vỉ', 10, false, 7000, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('63ca8a83-489c-4f67-a5ed-ba91b96037fa', '5d4ee24e-c255-4e0f-840d-7a057f51c5e5', 'Hộp', 100, false, 70000, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('74075abb-80da-4fa4-b1c6-906ffcc9193a', 'f8a1d61a-fb9a-40c1-b26a-7a4b67dcd36f', 'Vỉ', 15, false, 32595, 35000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('fb3ad48b-c5ce-4114-8158-850b69604e8d', 'f8a1d61a-fb9a-40c1-b26a-7a4b67dcd36f', 'Hộp', 30, false, 65190, 70000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('23a3ae9e-3a9b-4d8c-a610-ddc7b8b04315', 'c8d793ff-0f43-4f25-b445-68f037345afd', 'Hộp', 30, false, 60000, 90000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('abe3f804-0c24-4b9b-a151-cef8b1fbec22', '881ab78e-e0d6-4e3b-9bd7-c503a107aba9', 'Vỉ', 10, false, 37330, 45000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('48425c03-a3ba-4c7c-91d8-1f479c4f5dc6', '881ab78e-e0d6-4e3b-9bd7-c503a107aba9', 'Hộp', 30, false, 111990, 135000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('17cbd5c0-1db9-402f-b541-8a69c085629e', '5cfd1fbd-53e7-45f5-a442-e19379225b06', 'Vỉ', 10, false, 3050, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('4ea82a79-34c0-48c6-8ed5-9675371347f6', '5cfd1fbd-53e7-45f5-a442-e19379225b06', 'Hộp', 100, false, 30500, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('b8517006-35ea-4f67-b793-f07fed199efd', '95f4be85-249d-43d2-949a-e4a8960e32b0', 'Vỉ', 10, false, 8900, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('7331cc7f-1069-4e71-95e4-f142f1e8381e', '95f4be85-249d-43d2-949a-e4a8960e32b0', 'Hộp', 100, false, 89000, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('eeed2f78-29dc-40aa-aa98-3c83bda1b1db', '53261420-a5fd-4b51-bffe-263e9c51f6c0', 'Vỉ', 10, false, 8140, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('62d2aee5-732b-43da-a8e3-d9c5e9e9cef9', '53261420-a5fd-4b51-bffe-263e9c51f6c0', 'Hộp', 100, false, 81400, 200000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('bc157ecb-4a3a-4f91-96c3-ab9b0106b9b7', '3453e8b9-2f28-4ee9-a1f6-493e72fc0930', 'Vỉ', 10, false, 3500, 5000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('9dad7ed2-6400-48a4-81b8-9955f80b0c4f', '3453e8b9-2f28-4ee9-a1f6-493e72fc0930', 'Hộp', 100, false, 35000, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('d5896670-6e92-4747-a586-f2a1800251b6', '584974ca-8098-4b01-a5d2-4a786000d46d', 'Vỉ', 10, false, 6220, 8000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('890969b4-b1c8-4712-b6f3-0222416e3ae1', '584974ca-8098-4b01-a5d2-4a786000d46d', 'Hộp', 100, false, 62200, 80000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('662131f4-aaf4-4856-8527-8336402287b4', '8947864a-f829-410b-9381-c94f8e53aaa1', 'Vỉ', 10, false, 8000, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('5631f0b1-0927-4b7b-b6b0-b33b3d39943a', '8947864a-f829-410b-9381-c94f8e53aaa1', 'Hộp', 100, false, 80000, 200000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('aab24cbe-39e9-4c7d-b1e7-9868ad602e71', 'c864a9fa-f436-4887-a92f-5a76d04a4ea3', 'Vỉ', 20, false, 3000, 5000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('1f26d076-e43b-463b-b383-92a3af4e7b4e', 'c864a9fa-f436-4887-a92f-5a76d04a4ea3', 'Hộp', 200, false, 30000, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('53f473b1-ed10-429a-a35b-ea5b20bb495c', '6196c17a-369b-4cc8-89c9-27553472cf67', 'Vỉ', 10, false, 5100, 7000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('0b5cf1d5-b16b-440c-9bcd-e808006bb45c', '6196c17a-369b-4cc8-89c9-27553472cf67', 'Hộp', 100, false, 51000, 70000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('7925bd7a-abbd-46ba-aeab-195a8f0490ed', '458ca570-66af-46db-8d57-be9f7fc57da2', 'Vỉ', 10, false, 10000, 15000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('7ce1a2bb-0388-4cf6-bf69-1abdbff16e46', '458ca570-66af-46db-8d57-be9f7fc57da2', 'Hộp', 30, false, 30000, 45000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('a353bcb2-f4a9-4013-9ece-81024e745459', 'dc63431f-6f9e-4873-8da7-5f8f95e04add', 'Hộp', 30, false, 24000, 33000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('95d5420b-2e6e-490d-8098-92041dfab698', 'dc63431f-6f9e-4873-8da7-5f8f95e04add', 'Vỉ', 10, false, 8000, 11000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('b2dd773e-f5a8-4c94-98d5-cf8820669eff', 'dd41d322-eb1c-44ea-8ec3-cfd8150b2c4a', 'Vỉ', 10, false, 8000, 15000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('1f879af5-ffcc-455d-bd9c-d2d0217efd31', 'dd41d322-eb1c-44ea-8ec3-cfd8150b2c4a', 'Hộp', 100, false, 80000, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('715734ee-d2b5-4b51-b08f-9cd23ff31faf', '46c4447c-b512-45f9-96d2-22f3bd0c6daa', 'Vỉ', 10, false, 4570, 6000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('edcd1797-5654-4a6c-80de-3f3ddc908558', '46c4447c-b512-45f9-96d2-22f3bd0c6daa', 'Hộp', 100, false, 45700, 60000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('f5e7bc9a-b39c-4303-ba32-647fd79699de', '6ad4ed88-5df1-4077-a9e1-5025c4021e16', 'Vỉ', 10, false, 11400, 13000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('1fed0d53-8820-4d9c-bbb2-bb8720f2fa19', '6ad4ed88-5df1-4077-a9e1-5025c4021e16', 'Hộp', 100, false, 114000, 130000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('b94d5e16-238f-48eb-8e88-19912ddbd9e0', '321edf53-e8ba-4752-85cb-915f85a20c94', 'Vỉ', 10, false, 1500, 3500, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('383467d7-96d9-4cc1-86ba-d48d95a7f3e2', '321edf53-e8ba-4752-85cb-915f85a20c94', 'Hộp', 100, false, 15000, 35000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('55bf9417-f353-4176-92e8-52c67773bcf4', 'b122e132-dbaa-46aa-b857-48765ef1f6e7', 'Vỉ', 10, false, 37000, 40000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('f17b9fe1-2e6a-452c-bdce-c54514de2921', 'b122e132-dbaa-46aa-b857-48765ef1f6e7', 'Hộp', 30, false, 111000, 120000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('df826aa4-1dbc-4d6b-aee0-ee2d40f328ee', '2279c0d2-3582-4e1d-9b10-1263d9e3b24e', 'Vỉ', 10, false, 8390, 9000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('d33b01ae-2af8-439a-961a-bfb9a9b20c1b', '2279c0d2-3582-4e1d-9b10-1263d9e3b24e', 'Hộp', 100, false, 83900, 90000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('10c326bf-0118-4960-b98b-e146b3f8f560', '8c200c55-97de-4507-bec6-6173778f431e', 'Vỉ', 10, false, 12080, 15000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('2594e64b-d223-4d9d-aa9e-7ec574ea6d6e', '8c200c55-97de-4507-bec6-6173778f431e', 'Hộp', 10, false, 12080, 15000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('2e28e5d8-2d53-4d06-b061-af7661c07e29', '4f082a82-af52-46ca-a4c5-42c406659a87', 'Vỉ', 6, false, 31998, 42000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('6b4df885-d899-49a6-a7ae-1693a73826dc', '4f082a82-af52-46ca-a4c5-42c406659a87', 'Hộp', 6, false, 31998, 42000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('7e4c9dec-9d0f-4268-936f-75bcc7fd47f3', '43bce64e-7c1f-411c-b263-5f6791be3c62', 'Vỉ', 10, false, 3500, 5000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('53e46895-2ec3-4bb7-88bd-de2e56462e1a', '43bce64e-7c1f-411c-b263-5f6791be3c62', 'Hộp', 100, false, 35000, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('47b5a4e5-2d67-4955-b820-9b83f190bfe0', 'b2449531-f6bd-49e4-9542-0bfe2a9c78ed', 'Vỉ', 10, false, 22640, 35000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('9a2bf1a5-06ed-459d-9ed0-9cb739743dd6', 'b2449531-f6bd-49e4-9542-0bfe2a9c78ed', 'Hộp', 100, false, 226400, 350000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('23bde852-ecab-45f7-a8d5-c7f8853205db', '3ad6e4dc-eb10-448b-9dc4-5b0060dc198f', 'Vỉ', 10, false, 7300, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('1606fa88-2c15-405f-ab7c-7b30807d6d8d', '3ad6e4dc-eb10-448b-9dc4-5b0060dc198f', 'Hộp', 30, false, 21900, 30000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('643f3192-fee9-4d9c-bc71-54209cc71ee1', '2448ac3f-1339-4dcc-8880-b27f9548bd28', 'Vỉ', 10, false, 5070, 7000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('31ff65f0-a8b2-4e1d-be48-6a34ef93ca4d', '2448ac3f-1339-4dcc-8880-b27f9548bd28', 'Hộp', 100, false, 50700, 70000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('8aa2c1c4-93ca-4d64-ad21-492e87428050', '049cf8e3-4c9d-4831-be58-447008fb01e2', 'Vỉ', 10, false, 3100, 5000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('31ab02cf-35f9-4cdd-9a41-a7707a28e1cd', '049cf8e3-4c9d-4831-be58-447008fb01e2', 'Hộp', 100, false, 31000, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('79db195b-e246-4f98-b7e8-c45a557b4594', '79a78ea2-2500-4c12-a5ae-3dd6df94229a', 'Hộp', 30, false, 143400, 165000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('254fe41b-edec-45e8-9a2f-043b342796d8', '79a78ea2-2500-4c12-a5ae-3dd6df94229a', 'Vỉ', 10, false, 47800, 55000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('764b1a4a-a1a6-40a0-9a56-235964b28542', 'b0a964c7-09ea-49aa-8457-6eb2b3c2aada', 'Vỉ', 10, false, 19200, 25000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('7fb95af7-b8d2-4001-817c-b23206285030', 'b0a964c7-09ea-49aa-8457-6eb2b3c2aada', 'Hộp', 100, false, 192000, 250000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('d051bd9f-803f-4731-b2a4-fb8887437c00', '9b8bfc9c-d2a5-411c-be6a-1fae85018fbd', 'Hộp', 24, false, 150600, 192000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('d6b8f38b-37bb-4981-ab80-2ef771761355', '94124df5-e233-461c-b7f5-5848868a9688', 'Vỉ', 10, false, 18660, 25000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('3fb67093-777f-413f-a15b-ff99001c02c7', '94124df5-e233-461c-b7f5-5848868a9688', 'Hộp', 100, false, 186600, 250000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('8e705dc7-03c6-4b04-9e22-307b275d27c3', '7f975625-f4ef-4be7-9006-4ccdbd9282bd', 'Vỉ', 10, false, 7400, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('fd341b37-9cb0-4e4e-a3dd-e3e876140e3c', '7f975625-f4ef-4be7-9006-4ccdbd9282bd', 'Hộp', 100, false, 74000, 200000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('d492244c-d749-4405-a64d-6b4886910307', '94dd8e96-ab4b-4fc2-abbb-61f6c796529f', 'Vỉ', 10, false, 7500, 15000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('20c7a522-8f87-4b27-ba0d-d1b1acc77c19', '94dd8e96-ab4b-4fc2-abbb-61f6c796529f', 'Hộp', 100, false, 75000, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('43a0eff6-07ce-48ac-93a5-990dcc0f37e2', '7f98505f-c3ed-4218-a3a0-385d053ff936', 'Vỉ', 10, false, 21700, 25000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('dc99a47b-95ea-4eed-a97c-d321e51a0dc8', '7f98505f-c3ed-4218-a3a0-385d053ff936', 'Hộp', 100, false, 217000, 250000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('3db3cc52-aea9-4784-82a6-eaaddee43ff3', 'bab98d2c-8902-4713-a040-c28edbbb9ddb', 'Vỉ', 10, false, 4000, 6000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('fd4c436c-6b59-46ea-ad54-89f067a1ce43', 'bab98d2c-8902-4713-a040-c28edbbb9ddb', 'Hộp', 20, false, 8000, 12000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('d5be68e4-397d-4f8d-aba7-0c3b5e2e2c0f', 'c2ed54a3-93fb-45e7-ae90-bd1bc9bca110', 'Vỉ', 10, false, 11440, 15000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('7ec53162-d5f3-4e9b-a486-b1a8d978c681', 'c2ed54a3-93fb-45e7-ae90-bd1bc9bca110', 'Hộp', 100, false, 114400, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('f451bfc2-f8ed-4c68-bd31-fdd7c05abcc6', '691b8a88-7639-4c18-8578-6ee6c2e3b14f', 'vỉ', 12, false, 6480, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('2e84382d-c599-443e-b7f2-c4f170e97b10', '691b8a88-7639-4c18-8578-6ee6c2e3b14f', 'Hộp', 180, false, 97200, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('2bd51618-2828-4db0-b0a8-14961f569d27', '7ee6eccc-adeb-443b-ad85-7dab7ffa487e', 'Vỉ', 4, false, 5505.28, 8000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('c46051ae-8682-48b0-9204-e5156e1f085e', '7ee6eccc-adeb-443b-ad85-7dab7ffa487e', 'Hộp', 100, false, 137632, 200000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('e739fb55-8078-42de-a2e9-c566a66ade87', 'f190daf4-9569-43d7-8f52-da2bcce6c4dd', 'Vỉ', 4, false, 6000, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('8130f197-b2ee-4d31-a173-e7222e90c066', 'f190daf4-9569-43d7-8f52-da2bcce6c4dd', 'Hộp', 20, false, 30000, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('3156417d-83a0-4b7a-b052-e3d073c5c2b0', '07be3f55-95bb-427f-be80-7559ad528376', 'Vỉ', 10, false, 2650, 5000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('942bc234-790d-4491-88da-44da9d26df92', '07be3f55-95bb-427f-be80-7559ad528376', 'Hộp', 100, false, 26500, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('de016d57-9cb1-4326-a4d7-4bd5f88fea74', '485db810-405d-4bf4-abdd-c6796a9fc215', 'Vỉ', 4, false, 5460, 6000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('5829d793-d34d-4f5d-8789-cdd0f6f94af0', '485db810-405d-4bf4-abdd-c6796a9fc215', 'Hộp', 20, false, 27300, 30000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('95009a4b-240f-41eb-b4f6-99f94ddb9163', '49efdc94-d72f-461c-a525-859358d2e7fc', 'Vỉ', 4, false, 12000, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('5cf34613-b0f5-4ee1-86c7-0783247e2aab', '49efdc94-d72f-461c-a525-859358d2e7fc', 'Hộp', 16, false, 48000, 55000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('82eea743-37c9-4cc5-8e7b-363a539c1639', '35cfe58c-93d9-497d-bb28-090bf65f1954', 'Hộp', 26, false, 102700, 130000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('3b91bfdc-ca0b-4a4d-a5b8-79d8f1c40d7b', '444338ad-d01e-4b45-8f3e-4f607ad5d496', 'Vỉ', 4, false, 4560, 6000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('7afa86bd-9ef2-455b-92e6-e5cb41ddd9a4', '444338ad-d01e-4b45-8f3e-4f607ad5d496', 'Hộp', 100, false, 114000, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('0275b04e-cd39-4cc3-9892-9a95abe56c89', '01521471-dd54-4c48-8dad-03a0a50dd50c', 'Hộp', 50, false, 27600, 40000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('4495a4b0-27ea-405b-a728-8760c14e6341', '01521471-dd54-4c48-8dad-03a0a50dd50c', 'Vĩ', 5, false, 2760, 4000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('3b1ef592-f81d-467d-b9e8-9057f3e3ad06', '3d8a9842-4b14-4e9c-8fee-ccbab3be20bc', 'Vỉ', 10, false, 9900, 15000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('7100631f-2c2e-4a91-92df-37dbad3d18c5', '3d8a9842-4b14-4e9c-8fee-ccbab3be20bc', 'Hộp', 100, false, 99000, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('c67f6b37-d12e-4f5b-a403-d813b8f51ed0', '8ce6a7c5-436c-4532-83a6-d08f41727556', 'Vỉ', 10, false, 4000, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('4fa51930-6fb9-46e1-a449-6356935f9929', '8ce6a7c5-436c-4532-83a6-d08f41727556', 'Hộp', 100, false, 40000, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('23216571-5dac-4d24-9774-7cb987b3a585', 'd80e4bb7-1445-42d3-864e-335ae9ee0568', 'Vỉ', 10, false, 21600, 40000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('e5befe96-5d3d-4c77-a75e-adecde002fd4', 'd80e4bb7-1445-42d3-864e-335ae9ee0568', 'Hộp', 30, false, 64800, 120000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('1594d08e-c8c3-4f4e-b894-b4da981a36ba', '111ab323-ca65-48e1-a56d-b9092f0a708c', 'Vỉ', 4, false, 4500, 6000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('775d7ee6-93c7-49f7-a9c8-dcfc47bc0830', '111ab323-ca65-48e1-a56d-b9092f0a708c', 'Hộp', 100, false, 112500, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('f5dee0c2-447f-499f-8d64-1bf377d7f405', '7f61985e-ff9e-4b8c-b4df-a682b5de6b55', 'Vỉ', 10, false, 10000, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('3ce454f5-9aa2-457d-a2eb-669adaba9fee', '7f61985e-ff9e-4b8c-b4df-a682b5de6b55', 'Hộp', 100, false, 100000, 200000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('d84e54a1-c4f2-4644-9beb-3009029caa84', '6356dc18-33e5-4565-a29e-ee01f911eddb', 'Hộp', 100, false, 2500000, 30000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('440da08c-f495-42af-af51-840e111d4d9e', '5c8fdcc8-8a09-496c-9aa9-43001418c87c', 'Hộp', 8, false, 232000, 272000, '8935106261128');
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('dafd89b6-e1ab-490b-a377-726790d0ca8f', '8990dfcb-370b-4901-9863-40bc8531a029', 'Vỉ', 10, false, 4000, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('b1f64cad-deef-44f0-8159-12681b280378', '8990dfcb-370b-4901-9863-40bc8531a029', 'Hộp', 100, false, 40000, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('682fdc89-ef30-4f9f-8e83-d355bb1fe25f', 'd9790e31-d929-4739-a409-0cfd9f836a51', 'Lọ', 30, false, 0, 230000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('ae6c08ed-0708-4184-b654-fa31160f8ebe', 'e55c326d-9785-4fd7-96cf-f162d2752ef3', 'vỉ', 10, false, 33000, 5000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('76ece64f-1767-4695-a601-1e7fa98f7a67', 'e55c326d-9785-4fd7-96cf-f162d2752ef3', 'hộp', 100, false, 330000, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('a2c4fb10-58e6-4269-bee8-2f8f8d3faa38', '93c55631-89c0-4452-93d9-3821a7220010', 'Vĩ', 10, false, 0, 5000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('30b86ded-c63a-46ff-8c80-2a05d1a72583', '93c55631-89c0-4452-93d9-3821a7220010', 'Hộp', 100, false, 0, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('3b4147c3-32b4-4de0-8ae9-98ec758152d1', 'c0e9672e-36e3-45d4-b8f8-7828c8e19525', 'Hộp', 3, false, 0, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('b013100a-d19f-4466-9793-0a0fb73b2ecd', '04063503-4342-4570-a7cd-a49312a73709', 'Hộp', 3, false, 0, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('1c4d204e-870d-45ca-b81e-6aff806f1ed0', 'be2fdf30-672a-4938-9099-60736b887fcb', 'Lọ', 20, false, 0, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('39b62367-9e58-41e1-ab1f-4d00885ec482', 'e320dd84-1265-44a4-a69b-5df0d0ff8f64', 'Tuýp', 20, false, 60000, 80000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('7a924b0e-fb3d-4ad3-8833-a32ee1b405c3', '682d9f3a-621d-443e-a5eb-408a06ed9afb', 'Vỉ', 10, false, 0, 15000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('a62406be-7d5e-4216-a9d8-46a82a127826', '682d9f3a-621d-443e-a5eb-408a06ed9afb', 'Hộp', 20, false, 0, 30000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('9419d86d-c245-4f6d-adf0-d744d05988e3', 'd2da56a5-0471-4841-9ae1-5e5bec4c509d', 'Vỉ', 10, false, 0, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('08154c05-cfad-44f4-8957-e6b6e1e77268', 'd2da56a5-0471-4841-9ae1-5e5bec4c509d', 'Hộp', 100, false, 0, 200000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('57ae2a73-c2ee-400a-a151-5e7f9d578abb', '7e790c70-45cc-44b8-8162-ae3f1a784ce5', 'Hộp', 12, false, 0, 60000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('cae31322-5ef6-4dee-93f5-31f8a5bf0e30', 'd317c5e5-4619-45df-8ee7-c8db51a784d5', 'Hộp', 20, false, 200000, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('3d0f8d8f-1e1a-46d9-92ac-c30bab2d1542', 'e9d182e3-e8ce-4c00-96d6-43c753941c69', 'Hộp', 6, false, 22458, 25000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('45d55a7c-fbd8-4f49-ba49-b00b0e33b56c', '27befd26-f848-474e-8732-ac663061c4b1', 'Vỉ', 10, false, 1679000, 58000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('ea31db13-7ea0-4dd3-9c4e-8598aae50bdb', '27befd26-f848-474e-8732-ac663061c4b1', 'Hộp', 30, false, 5037000, 170000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('e78c2cd3-f0dc-4e7f-b16c-6a05d4609983', '02f77ef6-4821-4e23-8277-6ca9fa41ee9a', 'Vỉ', 10, false, 30040, 32000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('487ec7ef-e91c-4bfe-9876-68b29c9ade44', '02f77ef6-4821-4e23-8277-6ca9fa41ee9a', 'Hộp', 50, false, 150200, 160000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('a0dc4623-5aee-4159-a019-4aa67a6f233a', '6e509699-0345-4a35-a72d-27250c8ab978', 'Vỉ', 20, false, 21670, 24000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('72666bb6-17bd-440c-9caf-56dbfbc42a98', '6e509699-0345-4a35-a72d-27250c8ab978', 'Hộp', 100, false, 108350, 120000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('3e6619e1-d722-46d4-a5d4-081bd024c4a1', '0a1677da-fe71-4c79-a5f0-348d64b757d3', 'Vỉ', 10, false, 10000, 15000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('5810f017-2c7f-45d1-ab39-f65569b30e3f', '0a1677da-fe71-4c79-a5f0-348d64b757d3', 'Hộp', 100, false, 100000, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('f6983203-fc02-4b97-ab05-4b51e2965c65', 'b7e1a95f-efb4-4d4f-b7cd-de68b529365b', 'Vĩ', 10, false, 6000, 10000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('3d8d14d9-ddb9-4978-8d38-aa8aa4642e78', 'b7e1a95f-efb4-4d4f-b7cd-de68b529365b', 'Hộp', 100, false, 60000, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('5845b466-b381-4fba-b57e-450f8035d444', '5989da3a-0927-4b7e-8fc6-214f5ea16e09', 'Vỉ', 10, false, 20000, 40000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('5853a42d-9dbe-4d27-8efb-fc62912dfe58', '5989da3a-0927-4b7e-8fc6-214f5ea16e09', 'Hộp', 30, false, 60000, 120000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('29c53620-641d-4272-aaf8-00e7dac0c9f7', 'd1fc861a-067a-48d2-8bc6-a4523fe4df79', 'Hộp', 3, false, 21000, 30000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('20db986a-6058-4750-9ff2-59ec6658809a', '36f3341e-025e-4c31-a50c-085edaf2787c', 'Vĩ', 10, false, 2800, 5000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('c5d0868e-6d65-4a2d-94f1-efcbc6dd84ed', '36f3341e-025e-4c31-a50c-085edaf2787c', 'Hộp', 100, false, 28000, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('de37070c-04fa-440c-bdf1-5963eb6ea7a3', '24831f11-e835-48df-a0ce-1089a96249b2', 'Hộp', 10, false, 31000, 50000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('b4e1bcb7-028c-4754-bc5b-c6778379a3ee', '2a84043f-31c3-4577-b2af-59660955a6eb', 'Hộp', 20, false, 0, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('19cd5493-ec04-46c0-80a8-5a770d95bda3', 'ea32794e-e01a-42b6-9786-65d1eadf19d8', 'Hộp', 20, false, 60000, 100000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('2cc6ef35-d270-40e2-9e48-d3a444946832', '075accdb-c6d2-48c4-ba85-2eb73280272a', 'Hộp', 20, false, 80000, 120000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('efe5314f-daf6-4bfc-bb6e-f3903c708c59', '9c4448d7-2e65-4053-a2ef-b1cda67b6663', 'Hộp', 20, false, 100000, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('ab8549c6-be4b-493d-a789-7e77db11fecc', '80828c02-5866-49f3-9196-2e9ee025d2fd', 'Hộp', 5, false, 20000, 35000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('8abd7bc5-2472-4a59-a57b-eedf311bf977', '46b74b7a-4b5f-4382-a714-4c84821b0a06', 'Vĩ', 10, false, 10000, 13500, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('d8e987c8-a7de-448c-bd22-87e8a609c558', '46b74b7a-4b5f-4382-a714-4c84821b0a06', 'Hộp', 30, false, 30000, 40000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('f62d8dcb-450b-4bb5-aa48-30cdd7953a2b', 'c52ff0f0-4d33-446e-a0f3-386cf625f5ab', 'Vĩ', 10, false, 10000, 20000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('7f0b14cb-4674-4623-bd5b-a565418bc93a', 'c52ff0f0-4d33-446e-a0f3-386cf625f5ab', 'Hộp', 100, false, 100000, 200000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('7d0ae13d-ad28-4e71-82a1-ce00fe6a834b', 'ce9de53a-4c1e-4b34-af02-ca1a33fd368b', 'Hộp', 100, false, 66740, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('9b06cbfc-36d5-411a-8393-440f063873bf', '44e135cc-2140-44d7-846c-67fa4543b37c', 'Hộp', 100, false, 103600, 200000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('378728d5-f64c-491e-b459-a946a7a719c9', 'e9483cdc-acd4-474c-917b-5ce1606bd14a', 'Vĩ', 10, false, 8000, 15000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('88045229-f9b4-42e2-9285-8960285b583c', 'e9483cdc-acd4-474c-917b-5ce1606bd14a', 'Hộp', 100, false, 80000, 150000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('37132341-6bf3-4893-a305-c0f64b3dfaa1', '3859d151-705d-4733-920b-174da43678ff', 'Gói', 10, false, 13000, 15000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('5143a2d6-76ac-4a08-be7d-de48fe05d413', '3859d151-705d-4733-920b-174da43678ff', 'Hộp', 20, false, 26000, 30000, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('483f06bc-babf-4b59-bd2a-e5a9de90a528', '1facd7cf-f475-481e-ab7b-54eeb8c37fc9', 'Vỉ', 10, false, 2260, 2500, NULL);
INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('1aedda1f-0012-464c-b53e-d13192649c23', '1facd7cf-f475-481e-ab7b-54eeb8c37fc9', 'Hộp', 100, false, 22600, 25000, NULL);

COMMIT;
