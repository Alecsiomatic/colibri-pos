DELETE FROM products;
DELETE FROM categories;

INSERT INTO categories (name, description, is_active, sort_order) VALUES 
('Ychilito Dulces Enchilados', 'Dulces enchilados con chamoy y chilito estilo Ychilito.', 1, 1),
('SNACKERY', 'Snacks preparados con la mezcla especial de Provi.', 1, 2),
('CHEESECAKE CUPS', 'Cheesecake cups disponibles segun existencia diaria.', 1, 3),
('FRESAS', 'Fresas con crema en versiones clasicas y especiales.', 1, 4),
('CREPAS', 'Crepas dulces con rellenos inspirados en los favoritos de la casa.', 1, 5);

SET @ychilito = (SELECT id FROM categories WHERE name = 'Ychilito Dulces Enchilados');
SET @snackery = (SELECT id FROM categories WHERE name = 'SNACKERY');
SET @cheesecake = (SELECT id FROM categories WHERE name = 'CHEESECAKE CUPS');
SET @fresas = (SELECT id FROM categories WHERE name = 'FRESAS');
SET @crepas = (SELECT id FROM categories WHERE name = 'CREPAS');

INSERT INTO products (name, description, price, category_id, is_available, image_url) VALUES 
('WINIS Enchilados', '200 gramos de Winis enchilados Ychilito.', 125, @ychilito, 1, 'https://res.cloudinary.com/drswibb0s/image/upload/v1764532452/restaurants/items/xypq56a3pzmvfkoxp9vp.png'),
('Skittles Enchilados', '162 gramos de Skittles enchilados con chamoy y chilito.', 135, @ychilito, 1, 'https://res.cloudinary.com/drswibb0s/image/upload/v1764531604/restaurants/items/lsn462tg2xne8p5awmdh.png'),
('Xtremes Belts Ychilito', '171 gramos de Xtremes Belts enchilados.', 145, @ychilito, 1, 'https://res.cloudinary.com/drswibb0s/image/upload/v1764531704/restaurants/items/mggnodoiceowugey71gu.png'),
('Salvavidas Ychilito', '150 gramos de Salvavidas enchilados.', 150, @ychilito, 1, 'https://res.cloudinary.com/drswibb0s/image/upload/v1764532125/restaurants/items/hehdyngyvu0fu3z3d1op.png'),
('Sour Patch Ychilito', '168 gramos de Sour Patch enchilados.', 145, @ychilito, 1, 'https://res.cloudinary.com/drswibb0s/image/upload/v1764531819/restaurants/items/gnkzsdjsz3ekj2z7pwn1.png'),
('Mix Golos Ychilito', '200 gramos de Golos, Gajos de Naranja, Frutitas y Manguitos.', 120, @ychilito, 1, 'https://res.cloudinary.com/drswibb0s/image/upload/v1764532341/restaurants/items/ni5intnjt9kjlytli9dk.png'),
('Frutitas Ychilito', '200 gramos de Frutitas enchiladas.', 105, @ychilito, 1, 'https://res.cloudinary.com/drswibb0s/image/upload/v1764532009/restaurants/items/nxy5mbbvlgv6vrxefl9v.png');

INSERT INTO products (name, description, price, category_id, is_available) VALUES 
('Provi', 'Papitas preparadas en un mix de Provi, repollo, cueritos, cacahuates y salsas.', 90, @snackery, 1);

INSERT INTO products (name, description, price, category_id, is_available) VALUES 
('Lotus Biscoff Cup', 'Mix de fresas, capa de cheesecake dulce y untable Lotus Biscoff.', 115, @cheesecake, 0),
('Galleta Oreo Cup', 'Mix de fresas, capa de cheesecake, Nutella y galleta Oreo.', 100, @cheesecake, 0);

INSERT INTO products (name, description, price, category_id, is_available, image_url) VALUES 
('Fresas Cheescake Tortuga', 'Mix de fresas, crema tradicional, Nutella, nuez y cheesecake tortuga.', 100, @fresas, 1, NULL),
('Fresas Cheescake Frambuesa', 'Mix de fresas, crema tradicional, Nutella, nuez y cheesecake frambuesa.', 100, @fresas, 1, NULL),
('De Lotus Biscoff', 'Mix de fresas, crema tradicional y preparado cremoso Lotus Biscoff.', 145, @fresas, 1, 'https://res.cloudinary.com/drswibb0s/image/upload/v1763609116/restaurants/items/rlhvebuu9qtm4mgifkf5.jpg'),
('Fresas Con Miel de Abelha', 'Mix de fresas y almendras con crema tradicional.', 145, @fresas, 1, 'https://res.cloudinary.com/drswibb0s/image/upload/v1763690680/restaurants/items/n6brhbfdaaorx0lqzuiq.jpg'),
('De Gloria Untable Las Sevillanas', 'Mix de fresas, crema tradicional y Gloria Untable con obleas.', 160, @fresas, 1, 'https://res.cloudinary.com/drswibb0s/image/upload/v1763608505/restaurants/items/f2wlfuiytvl1ytpyq4vp.jpg'),
('Cocada de Coro', 'Mix de fresas, crema tradicional y preparado cremoso Cocada de Coro.', 145, @fresas, 1, 'https://res.cloudinary.com/drswibb0s/image/upload/v1763609476/restaurants/items/lkxkibigdqhmwgdbqupq.jpg'),
('Chocolate', 'Mix de fresas, crema tradicional, Nutella, Kinder Delice y Kit Kat.', 125, @fresas, 1, 'https://res.cloudinary.com/drswibb0s/image/upload/v1763608938/restaurants/items/gbdp3kvibrus4onzfsyf.jpg'),
('Con Queso Crema Dulce', 'Mix de fresas, crema tradicional y queso crema dulce Philadelphia.', 115, @fresas, 1, 'https://res.cloudinary.com/drswibb0s/image/upload/v1763691468/restaurants/items/eoe5c0ht0mun9hbmhuh9.jpg'),
('Tradicional', 'Mix de fresas con la crema tradicional de la casa.', 90, @fresas, 1, 'https://res.cloudinary.com/drswibb0s/image/upload/v1763692287/restaurants/items/jnfbok0qfqjlu4gxrudt.jpg'),
('Sour x Ychilito', 'Mix de fresas frescas con chamoy y chilito receta Ychilito.', 90, @fresas, 1, 'https://res.cloudinary.com/drswibb0s/image/upload/v1763596243/restaurants/items/b6nxez2saemhcgydeeny.jpg');

INSERT INTO products (name, description, price, category_id, is_available) VALUES 
('Lucia', 'Crepa con fresas, nuez y untable de queso crema dulce Philadelphia.', 125, @crepas, 1),
('Isabel', 'Crepa con queso crema dulce, Nutella, fresas y platano.', 125, @crepas, 1),
('Norma (Lotus)', 'Crepa con queso crema dulce, Lotus Biscoff, fresas y crema tradicional.', 145, @crepas, 1),
('Marita (Glorias)', 'Crepa con queso crema dulce, Gloria Las Sevillanas, fresas y obleas.', 145, @crepas, 1);

SELECT 'Menu Liciosos cargado!' as resultado;
