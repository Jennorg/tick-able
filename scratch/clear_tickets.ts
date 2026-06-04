import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SERVICE_ROL_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function clearTickets() {
  console.log('🗑️ Eliminando todos los tickets y datos relacionados...');

  // 1. Delete comments first (due to foreign keys)
  const { error: commentsError } = await supabase.from('comments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (commentsError) {
    console.error('Error al borrar comentarios:', commentsError.message);
  } else {
    console.log('✅ Comentarios eliminados.');
  }

  // 2. Delete ia_audit_log
  const { error: auditError } = await supabase.from('ia_audit_log').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (auditError) {
    console.error('Error al borrar logs de IA:', auditError.message);
  } else {
    console.log('✅ Logs de auditoría IA eliminados.');
  }

  // 3. Delete notifications
  const { error: notifyError } = await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (notifyError) {
    console.error('Error al borrar notificaciones:', notifyError.message);
  } else {
    console.log('✅ Notificaciones eliminadas.');
  }

  // 4. Finally delete tickets
  const { error: ticketsError } = await supabase.from('tickets').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (ticketsError) {
    console.error('Error al borrar tickets:', ticketsError.message);
  } else {
    console.log('✅ Todos los tickets han sido eliminados.');
  }
}

clearTickets().catch(console.error);
