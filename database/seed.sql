-- ============================================
-- Seed Data for Development
-- Run after schema.sql in Supabase SQL Editor
-- ============================================

INSERT INTO products (name, slug, description, price, compare_price, category, sizes, colors, images, stock, is_published, is_featured, badge) VALUES

('Midnight Muse Mini', 'midnight-muse-mini', 'Step into effortless elegance with this stunning black mini dress. Designed with a soft off-shoulder neckline and flattering ruched detailing, it hugs your curves in all the right places.', 4000, NULL, 'mini', '{XS,S,M,L}', '[{"name":"Black","hex":"#1a1a1a"}]', '{"https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600"}', 25, true, true, 'NEW'),

('Scarlet Cut-Out Gown', 'scarlet-cutout-gown', 'Turn heads the moment you walk in. This statement red gown is designed to command attention with its bold front cut-out and sleek, body-contouring fit.', 6000, 7500, 'gowns', '{S,M,L}', '[{"name":"Red","hex":"#8B0000"},{"name":"Black","hex":"#1a1a1a"}]', '{"https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600"}', 15, true, true, 'SALE'),

('Midnight Casual Maxi', 'midnight-casual-maxi', 'Effortlessly sleek and endlessly versatile, this black maxi dress is your go-to for laid-back luxury.', 4500, NULL, 'maxi', '{S,M,L,XL}', '[{"name":"Black","hex":"#1a1a1a"},{"name":"Cream","hex":"#F5F5DC"}]', '{"https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600"}', 30, true, true, NULL),

('Black Ribbed Midi', 'black-ribbed-midi', 'Simple, sleek, and effortlessly classy — this black midi dress is a wardrobe essential with a stylish twist.', 4350, NULL, 'dresses', '{S,M,L,XL}', '[{"name":"Black","hex":"#1a1a1a"},{"name":"Burgundy","hex":"#800020"}]', '{"https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600"}', 20, true, false, NULL),

('Midnight Tie-Up Set', 'midnight-tie-up-set', 'Chic, sleek, confident. Step out in style with this striking black two-piece set designed to highlight your curves with effortless elegance.', 3800, NULL, 'two-piece', '{S,M,L}', '[{"name":"Black","hex":"#1a1a1a"},{"name":"Gold","hex":"#D4AF37"}]', '{"https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600"}', 18, true, true, 'NEW'),

('Wide-Leg Jumpsuit', 'wide-leg-jumpsuit', 'Elegant wide-leg jumpsuit with structured shoulders. Perfect for both day and evening occasions.', 5200, NULL, 'jumpsuits', '{S,M,L,XL}', '[{"name":"Black","hex":"#1a1a1a"}]', '{"https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"}', 12, true, false, NULL),

('Essential Noir Mini', 'essential-noir-mini', 'Simple, sleek, and undeniably sexy — this black mini dress is your go-to for effortless glam.', 3500, 4200, 'mini', '{XS,S,M,L}', '[{"name":"Black","hex":"#1a1a1a"},{"name":"Red","hex":"#8B0000"}]', '{"https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=600"}', 22, true, false, 'SALE'),

('Emerald Draped Gown', 'emerald-draped-gown', 'Flowing elegance for your special night. This emerald gown features a draped bodice and a flattering floor-length silhouette.', 7200, NULL, 'gowns', '{S,M,L}', '[{"name":"Emerald","hex":"#004D40"},{"name":"Black","hex":"#1a1a1a"}]', '{"https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600"}', 10, true, true, 'NEW');
