/**
 * GUIA DE CONFIGURAÇÃO DO SUPABASE:
 * 
 * 1. Crie um projeto no Supabase (https://supabase.com/).
 * 2. Crie uma tabela chamada "demandas_cbtt" com as colunas:
 *    - id (uuid ou bigint autoincremento, chave primária)
 *    - nome (text)
 *    - cr (text)
 *    - estado (text)
 *    - tipo_problema (text)
 *    - descricao (text)
 *    - anexo_url (text)
 *    - created_at (timestampz, default: now())
 * 
 * 3. Crie um Storage Bucket (public) chamado "anexos_demandas".
 * 
 * 4. Desative (ou configure corretamente) o RLS da tabela 'demandas_cbtt' para permitir INSERT e SELECT.
 * 
 * 5. Substitua as credenciais abaixo e RENOMEIE este arquivo para config.js.
 *    (O HTML de exemplo está buscando "config.example.js", certifique-se de atualizar na tag script do index.html e admin.html se renomear!)
 */

const SUPABASE_URL = 'https://ixmpbnqrkrebzjkweaxm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4bXBibnFya3JlYnpqa3dlYXhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMzY2NDEsImV4cCI6MjA5MTcxMjY0MX0.CkCle1CoLt803PnFXpcRy3noO-yFFS1ZakkZWj1V828';

// Inicializando o cliente
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
