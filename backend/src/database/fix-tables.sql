-- Script para corrigir tabelas duplicadas no banco de dados

-- Verificar qual tabela tem dados (users ou Users)
DO $$
DECLARE
    users_count INTEGER;
    users_caps_count INTEGER;
BEGIN
    EXECUTE 'SELECT COUNT(*) FROM "users"' INTO users_count;
    EXECUTE 'SELECT COUNT(*) FROM "Users"' INTO users_caps_count;
    
    RAISE NOTICE 'users: % registros, Users: % registros', users_count, users_caps_count;
    
    -- Se users tiver dados e Users não
    IF users_count > 0 AND users_caps_count = 0 THEN
        RAISE NOTICE 'Migrando dados de "users" para "Users"';
        -- Criar tabela temporária com os dados de users
        EXECUTE 'CREATE TABLE "Users_temp" AS TABLE "users"';
        -- Excluir tabela Users vazia
        EXECUTE 'DROP TABLE IF EXISTS "Users"';
        -- Renomear tabela temporária
        EXECUTE 'ALTER TABLE "Users_temp" RENAME TO "Users"';
        -- Excluir tabela users
        EXECUTE 'DROP TABLE IF EXISTS "users"';
    -- Se Users tiver dados e users não
    ELSIF users_caps_count > 0 AND users_count = 0 THEN
        RAISE NOTICE 'Removendo tabela "users" vazia';
        EXECUTE 'DROP TABLE IF EXISTS "users"';
    -- Se ambas tiverem dados
    ELSIF users_count > 0 AND users_caps_count > 0 THEN
        RAISE NOTICE 'AVISO: Ambas as tabelas têm dados. Migração manual necessária!';
    END IF;
END $$;

-- Repetir para as outras tabelas duplicadas
DO $$
DECLARE
    reports_count INTEGER;
    reports_caps_count INTEGER;
BEGIN
    EXECUTE 'SELECT COUNT(*) FROM "reports"' INTO reports_count;
    EXECUTE 'SELECT COUNT(*) FROM "Reports"' INTO reports_caps_count;
    
    RAISE NOTICE 'reports: % registros, Reports: % registros', reports_count, reports_caps_count;
    
    IF reports_count > 0 AND reports_caps_count = 0 THEN
        RAISE NOTICE 'Migrando dados de "reports" para "Reports"';
        EXECUTE 'CREATE TABLE "Reports_temp" AS TABLE "reports"';
        EXECUTE 'DROP TABLE IF EXISTS "Reports"';
        EXECUTE 'ALTER TABLE "Reports_temp" RENAME TO "Reports"';
        EXECUTE 'DROP TABLE IF EXISTS "reports"';
    ELSIF reports_caps_count > 0 AND reports_count = 0 THEN
        RAISE NOTICE 'Removendo tabela "reports" vazia';
        EXECUTE 'DROP TABLE IF EXISTS "reports"';
    ELSIF reports_count > 0 AND reports_caps_count > 0 THEN
        RAISE NOTICE 'AVISO: Ambas as tabelas têm dados. Migração manual necessária!';
    END IF;
END $$;

DO $$
DECLARE
    animals_count INTEGER;
    animals_caps_count INTEGER;
BEGIN
    EXECUTE 'SELECT COUNT(*) FROM "animals"' INTO animals_count;
    EXECUTE 'SELECT COUNT(*) FROM "Animals"' INTO animals_caps_count;
    
    RAISE NOTICE 'animals: % registros, Animals: % registros', animals_count, animals_caps_count;
    
    IF animals_count > 0 AND animals_caps_count = 0 THEN
        RAISE NOTICE 'Migrando dados de "animals" para "Animals"';
        EXECUTE 'CREATE TABLE "Animals_temp" AS TABLE "animals"';
        EXECUTE 'DROP TABLE IF EXISTS "Animals"';
        EXECUTE 'ALTER TABLE "Animals_temp" RENAME TO "Animals"';
        EXECUTE 'DROP TABLE IF EXISTS "animals"';
    ELSIF animals_caps_count > 0 AND animals_count = 0 THEN
        RAISE NOTICE 'Removendo tabela "animals" vazia';
        EXECUTE 'DROP TABLE IF EXISTS "animals"';
    ELSIF animals_count > 0 AND animals_caps_count > 0 THEN
        RAISE NOTICE 'AVISO: Ambas as tabelas têm dados. Migração manual necessária!';
    END IF;
END $$; 