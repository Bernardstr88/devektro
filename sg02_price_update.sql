-- SG-02 Price Update
-- Step 1: Record OLD prices as historical entries in material_prices
-- Step 2: Update materials.unit_price to new SG-02 prices
-- NOTE: unit_price_at_time on existing BOMs is already backfilled, so old installations keep their price

-- Helper: insert historical price + update current price
-- We match by article_number (most reliable)

DO $$
DECLARE
  r RECORD;
BEGIN
  -- Define SG-02 price updates as temp table
  CREATE TEMP TABLE sg02_prices (
    article_number TEXT,
    supplier TEXT,
    name TEXT,
    new_price NUMERIC
  );

  INSERT INTO sg02_prices (article_number, supplier, name, new_price) VALUES
    -- Aanhangwagen
    ('/', 'Deckx', 'Aanhangwagen DECKX', 7984.33),
    -- Victron
    ('QUA488024000', 'Ysebaert', 'Victron QUATTRO 48/8000/110', 2382.00),
    ('QUA481030010', 'Ysebaert', 'Victron QUATTRO 48/10000/140-100/100', 2996.74),
    ('QUA483150000', 'Ysebaert', 'Victron QUATTRO 48/15000', 3472.99),
    ('PMP482505012', 'Ysebaert', 'Victron Multiplus II 48/5000/70-50', 577.85),
    ('PMP483105000', 'Ysebaert', 'Victron Multiplus II 48/10000/140-100', 1204.45),
    ('BPP900455070', 'Ysebaert', 'Victron GX Touch 70 voor Cerbo', 224.90),
    ('BPP900450100', 'Ysebaert', 'Victron Cerbo GX system monitoring', 254.81),
    ('BPP900480100', 'Ysebaert', 'Victron Ekrano GX', 391.30),
    ('LYN060102000', 'Ysebaert', 'Lynx Distributor M8', 139.76),
    ('LYN060102010', 'Ysebaert', 'Lynx Distributor M10', 139.75),
    ('LYN040102100', 'Ysebaert', 'Lynx Shunt', 259.36),
    ('LYN034160200', 'Ysebaert', 'Lynx smart BMS 500A', 662.36),
    ('LYN034170210', 'Ysebaert', 'Lynx smart BMS 1000A', 866.00),
    ('LYN034160310', 'Ysebaert', 'Lynx smart BMS 500A NG', 473.85),
    ('LYN034170310', 'Ysebaert', 'Lynx smart BMS 1000A NG', 631.15),
    ('ORI481210110', 'Ysebaert', 'Orion-Tr 48/12-9A (110W) insulated DC-DC converter', 44.20),
    ('SCC110020160R', 'Ysebaert', 'Regelaar Smart MPPT 100/20 12V/24V/48V - 20A VE.Direct', 62.40),
    ('SCC125060221', 'Ysebaert', 'Regelaar Smart MPPT 250/60 12V/24V/48V - 60A VE.Direct', 287.95),
    ('SCC145110512', 'Ysebaert', 'Smartsolar MPPT RS 450/100 VE Can', 768.30),
    ('SCC145120510', 'Ysebaert', 'Smartsolar MPPT RS 450/200 VE Can', 1344.85),
    ('CIP136060010', 'Ysebaert', 'Megafuse 60A - 32v- 5stuks', 10.40),
    ('CIP137125010', 'Ysebaert', 'Megafuse 125A - 58V', 20.15),
    ('CIP137250010', 'Ysebaert', 'Megafuse 200A - 58V', 20.15),
    ('CIP137300010', 'Ysebaert', 'Megafuse 300A - 58V', 20.15),
    ('ASS030530209', 'Ysebaert', 'VE Direct 0,9m', 9.75),
    ('ASS030530218', 'Ysebaert', 'VE Direct 1,8m', 9.75),
    ('ASS030530230', 'Ysebaert', 'VE Direct 3m', 10.40),
    ('VBS127010010', 'Ysebaert', 'Accuschakelaar 275A', 24.05),
    ('CIP000100001', 'Ysebaert', 'Zekeringhouder + kap voor Megafuses', 13.07),
    -- Kabel
    ('ACCUKABEL-95-ZW', 'Ysebaert', 'Accukabel 95 mm² zwart (per meter)', 23.77),
    ('ACCUKABEL-70-ZW', 'Ysebaert', 'Accukabel 70 mm² zwart (per meter)', 17.80),
    ('ACCUKABEL-50-ZW', 'Ysebaert', 'Accukabel 50 mm² zwart (per meter)', 13.09),
    ('ACCUKABEL-35-ZW', 'Ysebaert', 'Accukabel 35 mm² zwart (per meter)', 9.46),
    ('338139', 'Cebeo', 'Kabeloog 95 mm² - oog 8 m', 2.49),
    ('338132', 'Cebeo', 'Kabeloog 70 mm² - oog 8 m', 1.82),
    ('338125', 'Cebeo', 'Kabeloog 50 mm² - oog 8 m', 1.25),
    ('336565', 'Cebeo', 'Kabeloog 35 mm² - oog 8 mm', 0.90),
    ('5414325', 'Cebeo', '3G2,5 Soepel', 1.92),
    ('5414412', 'Cebeo', '3G4 Soepel', 4.06),
    ('5414562', 'Cebeo', '3G6 Soepel', 7.77),
    ('5414337', 'Cebeo', '5G6 Soepel', 12.29),
    ('5414515', 'Cebeo', '3G10 Soepel', 12.35),
    ('5414385', 'Cebeo', '5G10 Soepel', 15.04),
    -- Batterij
    ('BAT524120610', 'Victron', 'Lithium smart batterij 25,6V - 200Ah', 1327.95),
    ('BAT524120620', 'Victron', 'Lithium smart batterij 25,6V - 200Ah NG', 1261.65),
    ('SLPPB35BSB', 'Distrelec', 'Amphenol Surlok 8mm Cable Plug zwart 150A', 29.19),
    ('SLPPB35BSO', 'Distrelec', 'Amphenol Surlok 8mm Cable Plug oranje 150A', 24.74),
    -- Communicatie
    ('Teltonika RUT241', '', 'Teltonika RUT241 - E Sim', 154.00),
    -- Zekeringen
    ('18662', 'Cebeo', 'Automaat 4p 125A 25kA C', 442.16),
    ('19064', 'Cebeo', 'uitschakelspoel Multi 9 - MX-OF - 230..415 V AC', 70.32),
    ('C124160LS', 'Cebeo', 'Automaat 4p NSXM 160NA', 376.50),
    ('LV426850', 'Cebeo', 'uitschakelspoel MX 12Vcc', 78.50),
    ('43059423', 'Cebeo', 'Schneider 2P 40A 300mA', 37.07),
    ('4305944', 'Cebeo', 'Schneider 4P 40A 300mA', 38.27),
    ('4305943', 'Cebeo', 'Schneider 2P 63A 300mA', 56.89),
    ('5118210', 'Cebeo', 'Schneider 2P 4A', 9.06),
    ('4305917', 'Cebeo', 'Schneider 2P 16A', 4.99),
    ('4305918', 'Cebeo', 'Schneider 2P 20A', 4.71),
    ('4305919', 'Cebeo', 'Schneider 2P 25A', 12.26),
    ('4305920', 'Cebeo', 'Schneider 2P 32A', 12.70),
    ('4305921', 'Cebeo', 'Schneider 2P 40A', 10.79),
    ('4367704', 'Cebeo', 'Schneider 2P 63A - ic60a', 30.47),
    ('4305931', 'Cebeo', 'Schneider 4P 16A', 27.12),
    ('4305932', 'Cebeo', 'Schneider 4P 20A', 27.12),
    ('4305934', 'Cebeo', 'Schneider 4P 32A', 30.43),
    ('4305933', 'Cebeo', 'Schneider 4P 25A', 28.77),
    ('4305935', 'Cebeo', 'Schneider 4P 40A', 34.52),
    ('4130718', 'Cebeo', 'Schneider 4P 63A', 71.64),
    ('4106896', 'Cebeo', 'Schneider 1P 1A 1 module DC', 20.76),
    ('4609704', 'Cebeo', 'Automaat DC 4A C miniatuurcircuitonderbreker C60H', 26.52),
    ('4107504', 'Cebeo', 'Schneider schakelaar 2P 20A', 14.70),
    ('4417601', 'Cebeo', 'Hager Modulaire omschakelaar 3 standen 2P 40A', 43.92),
    ('4417603', 'Cebeo', 'Hager Modulaire omschakelaar 3 standen 4P 40A', 74.63),
    ('4231589', 'Cebeo', 'Hager M draai-omschakelaar 3 standen 4P 40A', 94.45),
    ('4106908', 'Cebeo', 'uitschakel hulpelement iMX', 36.97),
    ('A9A26904', 'Cebeo', 'Schneider hulpcontact Acti9i OF', 22.70),
    ('AFX490C', 'Cebeo', 'Hager differentieelautomaat C40 300mA', 248.25),
    ('MZ201', 'Cebeo', 'Hager hulpcontact 1NG + 1NO', 20.53),
    ('4107759', 'Cebeo', 'Schneider 4P 20A type B', 98.64),
    ('4107625', 'Cebeo', 'Schneider 4P 32A type B', 59.35),
    ('4107626', 'Cebeo', 'Schneider 4P 40A type B', 81.98),
    ('4107763', 'Cebeo', 'Schneider 4P 50A type B', 184.61),
    ('4107916', 'Cebeo', 'Schneider 2P 63A type B - IC60L', 132.10),
    -- Varia elektro
    ('XALK178F', 'Cebeo', 'Noodstop', 34.38),
    ('XALK178G', 'Cebeo', 'Noodstop 2NC/1NO', 39.98),
    ('DDR-15L-24', 'Telerex', 'DC-DC Ultra slim: Input 18-75Vdc', 20.68),
    ('7681', 'Cebeo', 'Aardingslat 1m', 26.75),
    ('7674', 'Cebeo', 'klemmen aardingslat', 61.02),
    ('4150262', 'Cebeo', 'Rittal ventilator 230/250', 133.18),
    ('3661663', 'Cebeo', 'Rittal thermostaat voor ventilatoren', 28.93),
    ('4150269', 'Cebeo', 'Rittal ventilator 550/600 m3/h', 171.27),
    -- Varia
    ('5024367', 'Cebeo', 'Soudal fix All High Tack wit', 8.30),
    -- Zekeringkast
    ('3708718', 'Cebeo', 'Legrand Marina 400x300', 85.20),
    ('3708722', 'Cebeo', 'Legrand Marina 500x400', 191.81),
    ('3708723', 'Cebeo', 'Legrand Marina 610x400', 214.72),
    ('3708724', 'Cebeo', 'Legrand Marina 700x510x250', 320.10),
    ('3708725', 'Cebeo', 'Legrand Marina 820x610x300', 444.11),
    ('7318425', 'Cebeo', 'Legrand Modulair Frame 600x400', 130.45),
    ('7318426', 'Cebeo', 'Legrand Modulair frame 700x500', 162.17),
    ('7318427', 'Cebeo', 'Legrand Modulair frame 800x600', 190.59);

  -- For each price that actually changed, record old price and update
  FOR r IN
    SELECT m.id, m.unit_price AS old_price, sp.new_price
    FROM sg02_prices sp
    JOIN materials m ON m.article_number = sp.article_number
    WHERE m.unit_price IS DISTINCT FROM sp.new_price
  LOOP
    -- Insert old price as historical record
    INSERT INTO material_prices (material_id, price, valid_from, notes)
    VALUES (r.id, r.old_price, '2024-01-01', 'Prijs vóór SG-02 update');

    -- Update current price
    UPDATE materials SET unit_price = r.new_price WHERE id = r.id;

    -- Insert new price as current record
    INSERT INTO material_prices (material_id, price, valid_from, notes)
    VALUES (r.id, r.new_price, '2026-03-01', 'SG-02 prijslijst');
  END LOOP;

  DROP TABLE sg02_prices;
END $$;
