INSERT INTO public.partnered_gyms (name, description, image_url, contact_email, contact_phone, website, mma_enabled, mma_webpage_url, mma_description, social_links)
VALUES (
  '24 Hour Fitness',
  'Your local 24 Hour Fitness — open 24/7 with state-of-the-art equipment, group classes, personal training, and more. Join the community and push your limits.',
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
  'info@24hourfitness.com',
  '(800) 432-6348',
  'https://www.24hourfitness.com',
  true,
  'https://www.24hourfitness.com/classes/',
  'Train like a fighter with our MMA-inspired classes including kickboxing, boxing conditioning, and self-defense programs.',
  '{"instagram": "https://instagram.com/24hourfitness", "facebook": "https://facebook.com/24HourFitness", "twitter": "https://x.com/24hourfitness", "youtube": "https://youtube.com/24hourfitness", "tiktok": "https://tiktok.com/@24hourfitness"}'::jsonb
);