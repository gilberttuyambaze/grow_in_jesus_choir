-- Seed documents data
INSERT OR IGNORE INTO documents (id, filename, original_name, mime_type, size_bytes, record_id, uploaded_by_id, notes) VALUES
  ('doc_01', 'receipt_20261006_transport.pdf', 'Sunday_Transport_Payment_Proof.pdf', 'application/pdf', 142850, 'rec_05', 'user_sarah', 'Receipt issued by Kigali Express bus hire for rehearsal'),
  ('doc_02', 'receipt_20261002_cables.jpg', 'SoundHouse_Audio_Cables_Invoice.jpg', 'image/jpeg', 285400, 'rec_06', 'user_eric', 'Tax invoice for 4x balanced XLR microphone cables'),
  ('doc_03', 'receipt_20260925_hall.pdf', 'City_Worship_Hall_Booking_Agreement.pdf', 'application/pdf', 450120, 'rec_07', 'user_sarah', 'Deposit receipt and rental contract for anniversary concert');

