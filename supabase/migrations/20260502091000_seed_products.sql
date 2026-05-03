-- Seed the four launch products into the products table.
-- Uses ON CONFLICT DO NOTHING so re-running migrations is safe.
insert into public.products (slug, name, description, base_price_dkk, category, is_active, metadata)
values
  (
    'desk-cable-dock',
    '{"da": "Skrivebordskabel-dock", "en": "Desk cable dock", "zh": "桌面理线器"}',
    '{"da": "", "en": "", "zh": ""}',
    89,
    'Workspace',
    true,
    '{"colors": ["Black", "White", "Grey"], "customizable": false, "lead_time": "1-2 days", "image_url": "/images/product-cable-dock.png"}'
  ),
  (
    'aarhus-key-tag',
    '{"da": "Aarhus nøglering", "en": "Aarhus key tag", "zh": "奥胡斯钥匙扣"}',
    '{"da": "", "en": "", "zh": ""}',
    49,
    'Local gifts',
    true,
    '{"colors": ["Black", "White", "Grey"], "customizable": true, "lead_time": "1 day", "image_url": "/images/product-aarhus-keytag.png"}'
  ),
  (
    'modular-desk-tray',
    '{"da": "Modulært skrivebordsbakke", "en": "Modular desk tray", "zh": "模块桌面收纳盘"}',
    '{"da": "", "en": "", "zh": ""}',
    149,
    'Storage',
    true,
    '{"colors": ["Black", "White", "Grey"], "customizable": false, "lead_time": "2-3 days", "image_url": "/images/product-desk-tray.png"}'
  ),
  (
    'custom-name-tag',
    '{"da": "Personlig navneskilte", "en": "Custom name tag", "zh": "定制名牌"}',
    '{"da": "", "en": "", "zh": ""}',
    79,
    'Personalized',
    true,
    '{"colors": ["Black", "White", "Grey"], "customizable": true, "lead_time": "1-2 days", "image_url": "/images/product-name-tag.png"}'
  )
on conflict (slug) do nothing;
