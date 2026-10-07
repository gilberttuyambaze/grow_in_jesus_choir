-- Seed data for Grow in Jesus Choir Financial Platform

-- Roles
INSERT OR IGNORE INTO roles (id, name, description) VALUES
  ('role_leader', 'LEADER', 'Choir leader with financial oversight and administrative access'),
  ('role_member', 'MEMBER', 'Choir member with access to personal contributions and records submission'),
  ('role_admin', 'ADMIN', 'System administrator role reserved for platform maintenance');

-- Users (password hashes are securely placeholder-hashed; for development demo a standard sha256 or bcrypt)
INSERT OR IGNORE INTO users (id, email, password_hash, role_id, full_name, avatar_initials) VALUES
  ('user_sarah', 'sarah@growinjesus.rw', '$2a$12$eX9K37b5dGb3PqWfG6r7Uu5Fq0r8q0F7y5f0f3u7f8q0f7y5f0f3u', 'role_leader', 'Sarah Uwase', 'SU'),
  ('user_john', 'john@growinjesus.rw', '$2a$12$eX9K37b5dGb3PqWfG6r7Uu5Fq0r8q0F7y5f0f3u7f8q0f7y5f0f3u', 'role_member', 'John Doe', 'JD'),
  ('user_grace', 'grace@growinjesus.rw', '$2a$12$eX9K37b5dGb3PqWfG6r7Uu5Fq0r8q0F7y5f0f3u7f8q0f7y5f0f3u', 'role_member', 'Grace Mukamana', 'GM'),
  ('user_jean', 'jeanclaude@growinjesus.rw', '$2a$12$eX9K37b5dGb3PqWfG6r7Uu5Fq0r8q0F7y5f0f3u7f8q0f7y5f0f3u', 'role_member', 'Jean Claude', 'JC'),
  ('user_eric', 'eric@growinjesus.rw', '$2a$12$eX9K37b5dGb3PqWfG6r7Uu5Fq0r8q0F7y5f0f3u7f8q0f7y5f0f3u', 'role_member', 'Eric Nshimiyimana', 'EN');

-- Financial Categories
INSERT OR IGNORE INTO financial_categories (id, name, type, description) VALUES
  ('cat_inc_contributions', 'Member Contributions', 'income', 'Monthly choir member tithes and contributions'),
  ('cat_inc_donations', 'Donations', 'income', 'Voluntary contributions from patrons and church partners'),
  ('cat_inc_events', 'Concerts & Events', 'income', 'Concert ticketing, guest appearances, and anniversary gifts'),
  ('cat_inc_fundraising', 'Fundraising', 'income', 'Special targeted choir development campaigns'),
  ('cat_inc_other', 'Other Income', 'income', 'Miscellaneous choir income'),
  ('cat_exp_transport', 'Transport', 'expense', 'Bus rentals, rehearsal transit, and Sunday logistics'),
  ('cat_exp_equipment', 'Equipment', 'expense', 'Microphones, cables, audio hardware, and stands'),
  ('cat_exp_music', 'Music & Uniforms', 'expense', 'Sheet music, Robe tailoring, and choir attire'),
  ('cat_exp_venue', 'Venue & Rehearsal', 'expense', 'Hall rentals, sound system upkeep, and refreshments'),
  ('cat_exp_communication', 'Communication', 'expense', 'SMS reminders, internet, and platform costs'),
  ('cat_exp_admin', 'Administration', 'expense', 'Office stationery, bank charges, and printing'),
  ('cat_exp_other', 'Other Expense', 'expense', 'Uncategorized emergency expenses');

-- Seed 50 members
INSERT OR IGNORE INTO members (id, user_id, full_name, phone, voice_part, status, joined_date) VALUES
  ('mem_01', 'user_sarah', 'Sarah Uwase', '+250 788 111 001', 'Soprano', 'active', '2024-01-15'),
  ('mem_02', 'user_john', 'John Doe', '+250 788 111 002', 'Tenor', 'active', '2024-02-10'),
  ('mem_03', 'user_grace', 'Grace Mukamana', '+250 788 111 003', 'Alto', 'active', '2024-03-01'),
  ('mem_04', 'user_jean', 'Jean Claude', '+250 788 111 004', 'Bass', 'active', '2024-01-20'),
  ('mem_05', 'user_eric', 'Eric Nshimiyimana', '+250 788 111 005', 'Tenor', 'active', '2024-02-25'),
  ('mem_06', NULL, 'Aline Uwimana', '+250 788 111 006', 'Soprano', 'active', '2024-01-10'),
  ('mem_07', NULL, 'Patrick Habimana', '+250 788 111 007', 'Bass', 'active', '2024-01-12'),
  ('mem_08', NULL, 'Chantal Mutoni', '+250 788 111 008', 'Alto', 'active', '2024-01-15'),
  ('mem_09', NULL, 'David Mugisha', '+250 788 111 009', 'Tenor', 'active', '2024-01-18'),
  ('mem_10', NULL, 'Diane Ingabire', '+250 788 111 010', 'Soprano', 'active', '2024-01-22'),
  ('mem_11', NULL, 'Emmanuel Bizimana', '+250 788 111 011', 'Bass', 'active', '2024-02-01'),
  ('mem_12', NULL, 'Esperance Mukarwego', '+250 788 111 012', 'Alto', 'active', '2024-02-05'),
  ('mem_13', NULL, 'Fabrice Ndayisaba', '+250 788 111 013', 'Tenor', 'active', '2024-02-08'),
  ('mem_14', NULL, 'Gloria Umutoni', '+250 788 111 014', 'Soprano', 'active', '2024-02-12'),
  ('mem_15', NULL, 'Herve Manzi', '+250 788 111 015', 'Bass', 'active', '2024-02-15'),
  ('mem_16', NULL, 'Innocent Gasana', '+250 788 111 016', 'Tenor', 'active', '2024-02-20'),
  ('mem_17', NULL, 'Josiane Kanyange', '+250 788 111 017', 'Alto', 'active', '2024-02-22'),
  ('mem_18', NULL, 'Kevin Tuyishime', '+250 788 111 018', 'Bass', 'active', '2024-03-01'),
  ('mem_19', NULL, 'Liliane Uwamahoro', '+250 788 111 019', 'Soprano', 'active', '2024-03-05'),
  ('mem_20', NULL, 'Moses Hakizimana', '+250 788 111 020', 'Tenor', 'active', '2024-03-10'),
  ('mem_21', NULL, 'Nadine Umurerwa', '+250 788 111 021', 'Alto', 'active', '2024-03-15'),
  ('mem_22', NULL, 'Olivier Rwego', '+250 788 111 022', 'Bass', 'active', '2024-03-20'),
  ('mem_23', NULL, 'Pacifique Kayitesi', '+250 788 111 023', 'Soprano', 'active', '2024-04-01'),
  ('mem_24', NULL, 'Queen Isimbi', '+250 788 111 024', 'Alto', 'active', '2024-04-05'),
  ('mem_25', NULL, 'Richard Rukundo', '+250 788 111 025', 'Tenor', 'active', '2024-04-10'),
  ('mem_26', NULL, 'Sandrine Mutesi', '+250 788 111 026', 'Soprano', 'active', '2024-04-15'),
  ('mem_27', NULL, 'Theoneste Nshuti', '+250 788 111 027', 'Bass', 'active', '2024-04-20'),
  ('mem_28', NULL, 'Yvette Uwera', '+250 788 111 028', 'Alto', 'active', '2024-05-01'),
  ('mem_29', NULL, 'Zacharie Munyaneza', '+250 788 111 029', 'Tenor', 'active', '2024-05-05'),
  ('mem_30', NULL, 'Beata Mukeshimana', '+250 788 111 030', 'Soprano', 'active', '2024-05-10'),
  ('mem_31', NULL, 'Claude Nkurunziza', '+250 788 111 031', 'Bass', 'active', '2024-05-15'),
  ('mem_32', NULL, 'Denise Mukamusonera', '+250 788 111 032', 'Alto', 'active', '2024-05-20'),
  ('mem_33', NULL, 'Eliezer Habiyambere', '+250 788 111 033', 'Tenor', 'active', '2024-06-01'),
  ('mem_34', NULL, 'Fiona Umubyeyi', '+250 788 111 034', 'Soprano', 'active', '2024-06-05'),
  ('mem_35', NULL, 'Gilbert Niyonsaba', '+250 788 111 035', 'Bass', 'active', '2024-06-10'),
  ('mem_36', NULL, 'Hortense Nyirasafari', '+250 788 111 036', 'Alto', 'active', '2024-06-15'),
  ('mem_37', NULL, 'Ignace Twagirayezu', '+250 788 111 037', 'Tenor', 'active', '2024-06-20'),
  ('mem_38', NULL, 'Jeanne D''Arc Kayirangwa', '+250 788 111 038', 'Soprano', 'active', '2024-07-01'),
  ('mem_39', NULL, 'Lambert Nkeramugaba', '+250 788 111 039', 'Bass', 'active', '2024-07-05'),
  ('mem_40', NULL, 'Marie Claire Mukandayisenga', '+250 788 111 040', 'Alto', 'active', '2024-07-10'),
  ('mem_41', NULL, 'Noel Sibomana', '+250 788 111 041', 'Tenor', 'active', '2024-07-15'),
  ('mem_42', NULL, 'Odette Uwanyirigira', '+250 788 111 042', 'Soprano', 'active', '2024-07-20'),
  ('mem_43', NULL, 'Pascal Nshimiyimana', '+250 788 111 043', 'Bass', 'active', '2024-08-01'),
  ('mem_44', NULL, 'Rosine Mutamuriza', '+250 788 111 044', 'Alto', 'active', '2024-08-05'),
  ('mem_45', NULL, 'Serge Mugabo', '+250 788 111 045', 'Tenor', 'active', '2024-08-10'),
  ('mem_46', NULL, 'Therese Mukankusi', '+250 788 111 046', 'Soprano', 'active', '2024-08-15'),
  ('mem_47', NULL, 'Valens Nsengiyumva', '+250 788 111 047', 'Bass', 'active', '2024-08-20'),
  ('mem_48', NULL, 'Winnie Uwera', '+250 788 111 048', 'Alto', 'active', '2024-09-01'),
  ('mem_49', NULL, 'Xavier Ndayambaje', '+250 788 111 049', 'Tenor', 'active', '2024-09-05'),
  ('mem_50', NULL, 'Yvette Mukeshimana', '+250 788 111 050', 'Soprano', 'active', '2024-09-10');

-- Financial Records:
-- Total Income: 2,860,000 RWF
-- Total Expense: 1,015,000 RWF
-- Net Balance: 1,845,000 RWF
INSERT OR IGNORE INTO financial_records (id, type, category_id, amount, currency, record_date, description, member_id, recorded_by_id, status, reference_number) VALUES
  -- Income: 1,280,000 + 250,000 + 850,000 + 480,000 = 2,860,000 RWF
  ('rec_01', 'income', 'cat_inc_contributions', 1280000, 'RWF', '2026-10-07', 'October choir member contributions (42 members)', NULL, 'user_sarah', 'recorded', 'REF-2026-1001'),
  ('rec_02', 'income', 'cat_inc_donations', 250000, 'RWF', '2026-10-04', 'Choir anniversary donation from Elder Mukamana', 'mem_03', 'user_sarah', 'recorded', 'REF-2026-1002'),
  ('rec_03', 'income', 'cat_inc_events', 850000, 'RWF', '2026-09-28', 'Worship Night concert guest offerings', NULL, 'user_sarah', 'recorded', 'REF-2026-0901'),
  ('rec_04', 'income', 'cat_inc_fundraising', 480000, 'RWF', '2026-09-15', 'Annual uniform modernization fund', NULL, 'user_sarah', 'recorded', 'REF-2026-0902'),

  -- Expenses: 30,000 + 85,000 + 450,000 + 280,000 + 120,000 + 50,000 = 1,015,000 RWF
  ('rec_05', 'expense', 'cat_exp_transport', 30000, 'RWF', '2026-10-06', 'Transport for Sunday service team rehearsal', 'mem_04', 'user_sarah', 'recorded', 'EXP-2026-1001'),
  ('rec_06', 'expense', 'cat_exp_equipment', 85000, 'RWF', '2026-10-02', 'New microphone cables and jack adaptors', 'mem_05', 'user_sarah', 'needs_review', 'EXP-2026-1002'),
  ('rec_07', 'expense', 'cat_exp_venue', 450000, 'RWF', '2026-09-25', 'Sound system maintenance & hall booking', NULL, 'user_sarah', 'recorded', 'EXP-2026-0901'),
  ('rec_08', 'expense', 'cat_exp_music', 280000, 'RWF', '2026-09-20', 'Choir robes cleaning & seamstress repairs', NULL, 'user_sarah', 'recorded', 'EXP-2026-0902'),
  ('rec_09', 'expense', 'cat_exp_communication', 120000, 'RWF', '2026-09-10', 'Bulk SMS reminders and platform hosting', NULL, 'user_sarah', 'needs_review', 'EXP-2026-0903'),
  ('rec_10', 'expense', 'cat_exp_admin', 50000, 'RWF', '2026-09-05', 'Sheet music folder binders and printing', NULL, 'user_sarah', 'needs_review', 'EXP-2026-0904'),
  ('rec_11', 'income', 'cat_inc_contributions', 50000, 'RWF', '2026-10-07', 'Late contribution submission for October', 'mem_02', 'user_john', 'needs_review', 'REF-2026-1003');

-- Audit logs
INSERT OR IGNORE INTO audit_logs (id, actor_id, actor_name, action, target_type, target_id, details) VALUES
  ('aud_01', 'user_sarah', 'Sarah Uwase', 'RECORD_CREATED', 'financial_record', 'rec_01', '{"amount":1280000,"type":"income","category":"Contributions"}'),
  ('aud_02', 'user_sarah', 'Sarah Uwase', 'RECORD_CREATED', 'financial_record', 'rec_05', '{"amount":30000,"type":"expense","category":"Transport"}'),
  ('aud_03', 'user_john', 'John Doe', 'RECORD_CREATED', 'financial_record', 'rec_11', '{"amount":50000,"type":"income","category":"Contributions"}');

-- Notifications
INSERT OR IGNORE INTO notifications (id, user_id, title, message, type, is_read) VALUES
  ('notif_01', 'user_sarah', 'Pending Record for Review', 'John Doe submitted a 50,000 RWF contribution for October', 'warning', 0),
  ('notif_02', 'user_sarah', 'Budget Milestone', 'Choir current balance reached healthy 1,845,000 RWF threshold', 'success', 0),
  ('notif_03', 'user_john', 'Contribution Status', 'Your September contribution was verified and recorded', 'success', 1);

