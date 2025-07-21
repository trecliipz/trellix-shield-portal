
-- Create cyberattacks table to store latest cyberattack information
CREATE TABLE public.cyberattacks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  attack_type TEXT NOT NULL, -- 'vulnerability', 'malware', 'phishing', 'ddos', 'data_breach'
  severity TEXT NOT NULL, -- 'critical', 'high', 'medium', 'low'
  date_detected TIMESTAMP WITH TIME ZONE NOT NULL,
  source TEXT NOT NULL, -- 'CISA', 'MITRE', 'NVD', etc.
  target_sector TEXT, -- 'healthcare', 'finance', 'government', 'manufacturing'
  impact TEXT,
  mitigation_steps TEXT,
  external_id TEXT, -- CVE-ID, CISA ID, etc.
  source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.cyberattacks ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (since this is for display purposes)
CREATE POLICY "Anyone can view cyberattacks" ON public.cyberattacks FOR SELECT USING (true);

-- System can manage all cyberattack data
CREATE POLICY "System can manage cyberattacks" ON public.cyberattacks FOR ALL USING (true);

-- Insert sample cyberattack data
INSERT INTO public.cyberattacks (title, description, attack_type, severity, date_detected, source, target_sector, impact, mitigation_steps, external_id, source_url) VALUES
  ('CVE-2024-1234: Critical RCE in Apache Struts', 'Remote code execution vulnerability affecting Apache Struts 2.x versions allowing attackers to execute arbitrary commands.', 'vulnerability', 'critical', '2024-01-15 08:30:00+00', 'CISA', 'government', 'Complete system compromise possible', 'Update to latest version, apply security patches', 'CVE-2024-1234', 'https://cisa.gov/alert/1234'),
  ('Ransomware Campaign Targeting Healthcare', 'New ransomware variant specifically targeting hospital networks and medical devices.', 'malware', 'high', '2024-01-14 14:22:00+00', 'MITRE', 'healthcare', 'Patient data encryption, service disruption', 'Network segmentation, backup verification', 'ATT&CK-T1486', 'https://attack.mitre.org/techniques/T1486'),
  ('Supply Chain Attack on Software Vendor', 'Sophisticated attack compromising software distribution channels affecting multiple organizations.', 'data_breach', 'high', '2024-01-13 11:45:00+00', 'NVD', 'technology', 'Customer data exposure, intellectual property theft', 'Verify software integrity, update security protocols', 'INC-2024-0013', 'https://nvd.nist.gov/vuln/detail/CVE-2024-0013'),
  ('DDoS Attacks on Financial Infrastructure', 'Coordinated distributed denial of service attacks targeting major banking systems.', 'ddos', 'medium', '2024-01-12 16:18:00+00', 'CISA', 'finance', 'Service unavailability, customer access issues', 'Implement DDoS protection, traffic filtering', 'CISA-2024-0012', 'https://cisa.gov/alert/0012'),
  ('Phishing Campaign Impersonating IT Support', 'Large-scale phishing operation targeting corporate employees with fake IT support messages.', 'phishing', 'medium', '2024-01-11 09:33:00+00', 'MITRE', 'corporate', 'Credential theft, unauthorized access', 'Employee training, email filtering enhancement', 'ATT&CK-T1566', 'https://attack.mitre.org/techniques/T1566'),
  ('Zero-Day Exploit in Windows Kernel', 'Previously unknown vulnerability in Windows kernel allowing privilege escalation.', 'vulnerability', 'critical', '2024-01-10 13:27:00+00', 'NVD', 'enterprise', 'System-wide compromise, data exfiltration', 'Apply emergency patches, monitor system activity', 'CVE-2024-0010', 'https://nvd.nist.gov/vuln/detail/CVE-2024-0010'),
  ('IoT Botnet Targeting Smart Devices', 'Malware campaign infecting IoT devices to create massive botnet for cryptocurrency mining.', 'malware', 'medium', '2024-01-09 20:41:00+00', 'CISA', 'consumer', 'Device performance degradation, network congestion', 'Firmware updates, network monitoring', 'CISA-2024-0009', 'https://cisa.gov/alert/0009'),
  ('Database Breach at E-commerce Platform', 'SQL injection attack leading to customer database compromise affecting millions of users.', 'data_breach', 'high', '2024-01-08 07:55:00+00', 'NVD', 'retail', 'Personal information exposure, payment data at risk', 'Database security review, input validation', 'INC-2024-0008', 'https://nvd.nist.gov/vuln/detail/CVE-2024-0008'),
  ('Sophisticated APT Targeting Government', 'Advanced persistent threat campaign targeting government agencies using multiple attack vectors.', 'malware', 'critical', '2024-01-07 12:14:00+00', 'MITRE', 'government', 'Classified information theft, infrastructure compromise', 'Network isolation, threat hunting, system hardening', 'ATT&CK-G0001', 'https://attack.mitre.org/groups/G0001'),
  ('Mobile App Vulnerability Exposing User Data', 'Security flaw in popular mobile application allowing unauthorized access to user personal information.', 'vulnerability', 'medium', '2024-01-06 15:48:00+00', 'CISA', 'technology', 'Privacy violation, personal data exposure', 'App update mandatory, privacy settings review', 'CVE-2024-0006', 'https://cisa.gov/alert/0006');

-- Set up automatic daily fetch using cron (requires pg_cron extension)
-- This will be activated once the edge function is deployed
SELECT cron.schedule(
  'fetch-cyberattacks-daily',
  '0 6 * * *', -- Daily at 6 AM UTC
  $$
  SELECT net.http_post(
    url:='https://enwjspegjxkqrcmzlzqg.supabase.co/functions/v1/fetch-cyberattacks',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVud2pzcGVnanhrcXJjbXpsenFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODEwNDksImV4cCI6MjA2NTc1NzA0OX0.EIAEdQQk2H2xkMrX1EAO3iFzf3BrpC6vuww6PAHbqDQ"}'::jsonb,
    body:='{"trigger": "cron"}'::jsonb
  ) as request_id;
  $$
);
