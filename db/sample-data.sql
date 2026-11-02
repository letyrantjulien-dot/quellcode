-- ============================================================
-- QUELLCODE · sample data for a test database
-- Run after schema.sql. Everything here is either invented
-- (pumps, reports, stories: marked SAMPLE) or a published
-- ECHO card (3 of the archive's water facts, as in the live app).
-- No row comes from a real user of the app.
-- ============================================================

-- Three invented pumps. Coordinates are rough points in Berlin,
-- not real pumps; the refs start with "SAMPLE".
insert into pumps (id, lat, lng, address, district, ref, model, notes) values
 ('00000000-0000-4000-8000-000000000001', 52.5400, 13.4100, 'Sample street 1', 'Prenzlauer Berg', 'SAMPLE-1', 'Lauchhammer', 'Invented pump for testing'),
 ('00000000-0000-4000-8000-000000000002', 52.4990, 13.4180, 'Sample street 2', 'Kreuzberg',       'SAMPLE-2', 'Krause',      'Invented pump for testing'),
 ('00000000-0000-4000-8000-000000000003', 52.5170, 13.3000, 'Sample street 3', 'Charlottenburg',  'SAMPLE-3', null,          'Invented pump for testing');

-- One check: the first pump works (this opens ECHO year 1967).
insert into status_reports (pump_id, status) values
 ('00000000-0000-4000-8000-000000000001', 'working');

-- Two invented stories: one approved, one waiting for moderation.
insert into stories (pump_id, body, lang, state, body_en) values
 ('00000000-0000-4000-8000-000000000001', 'SAMPLE · Invented story for testing: a bucket by the pump, filled for the birds every morning.', 'en', 'approved', null),
 ('00000000-0000-4000-8000-000000000002', 'SAMPLE · Invented story for testing: this one waits in the moderation queue.', 'en', 'pending', null);

-- Three ECHO cards from the published archive.
insert into year_facts (year, theme, dating, source_url, text_de, text_en, text_fr, text_ru, text_tr) values
(1968, 'ocean', 'exact', 'https://en.wikipedia.org/wiki/Deep_Sea_Drilling_Project',
 $t$Das Bohrschiff Glomar Challenger beginnt das Deep Sea Drilling Project. Seine Bohrkerne vom Meeresgrund bestätigen bald, dass der Ozeanboden auseinanderdriftet.$t$,
 $t$The drilling ship Glomar Challenger begins the Deep Sea Drilling Project. Its cores from the ocean floor soon confirm that the seafloor is spreading apart.$t$,
 $t$Le navire de forage Glomar Challenger lance le Deep Sea Drilling Project. Ses carottes prélevées au fond de l’océan confirmeront bientôt l’expansion des fonds océaniques.$t$,
 $t$Буровое судно «Гломар Челленджер» начинает проект глубоководного бурения. Керны со дна океана вскоре подтвердят, что морское дно расходится.$t$,
 $t$Sondaj gemisi Glomar Challenger, Derin Deniz Sondaj Projesi’ne başlar. Okyanus tabanından alınan karotlar, deniz tabanının genişlediğini kısa sürede doğrular.$t$),
(1712, 'world', 'exact', 'https://en.wikipedia.org/wiki/Newcomen_atmospheric_engine',
 $t$Bei Dudley in England nimmt Thomas Newcomen seine Dampfmaschine in Betrieb, um Wasser aus einem Kohlebergwerk zu pumpen. Dampf füllt einen Zylinder, kaltes Wasser lässt ihn kondensieren, und der Luftdruck drückt den Kolben hinab. Eine Pumpe treibt das Zeitalter der Dampfkraft an.$t$,
 $t$Near Dudley in England, Thomas Newcomen sets his steam engine to work pumping water out of a coal mine. Steam fills a cylinder, cold water makes it condense, and the air pressure pushes the piston down. A pump starts the age of steam.$t$,
 $t$Près de Dudley, en Angleterre, Thomas Newcomen met en marche sa machine à vapeur pour pomper l’eau d’une mine de charbon. La vapeur remplit un cylindre, de l’eau froide la condense, et la pression de l’air pousse le piston vers le bas. Une pompe ouvre l’ère de la vapeur.$t$,
 $t$Около Дадли в Англии Томас Ньюкомен запускает паровую машину, чтобы откачивать воду из угольной шахты. Пар заполняет цилиндр, холодная вода его конденсирует, и давление воздуха толкает поршень вниз. С насоса начинается эпоха пара.$t$,
 $t$İngiltere’de Dudley yakınlarında Thomas Newcomen, bir kömür madeninden su pompalamak için buhar makinesini çalıştırır. Buhar bir silindiri doldurur, soğuk su onu yoğuşturur ve hava basıncı pistonu aşağı iter. Buhar çağını bir pompa başlatır.$t$),
(1695, 'world', 'timeless', 'https://en.wikipedia.org/wiki/Hand_pump',
 $t$Eine Saugpumpe saugt das Wasser eigentlich nicht. Sie nimmt die Luft aus dem Rohr, und der Luftdruck schiebt das Wasser hinauf. Deshalb kommt sie über etwa zehn Meter nicht hinaus, in der Praxis sogar weniger. Für tiefe Brunnen sitzt der Kolben unten im Wasser.$t$,
 $t$A suction pump does not really suck the water. It takes the air out of the pipe, and the air pressure pushes the water up. That is why it cannot lift more than about ten metres, and less in practice. For deep wells the piston sits down in the water.$t$,
 $t$Une pompe aspirante n’aspire pas vraiment l’eau. Elle retire l’air du tuyau, et c’est la pression de l’air qui pousse l’eau vers le haut. C’est pourquoi elle ne monte pas l’eau à plus de dix mètres environ, et moins en pratique. Pour les puits profonds, le piston se trouve en bas, dans l’eau.$t$,
 $t$Всасывающий насос на самом деле не всасывает воду. Он удаляет воздух из трубы, а воду вверх толкает давление воздуха. Поэтому он не поднимает её выше примерно десяти метров, а на практике и того меньше. В глубоких колодцах поршень стоит внизу, в воде.$t$,
 $t$Emme basma tulumba suyu aslında emmez. Borudaki havayı çıkarır, suyu yukarı iten hava basıncıdır. Bu yüzden suyu yaklaşık on metreden yükseğe çıkaramaz, uygulamada daha da az. Derin kuyularda piston aşağıda, suyun içinde durur.$t$);

select (select count(*) from pumps) as pumps, (select count(*) from stories) as stories, (select count(*) from year_facts) as facts;
