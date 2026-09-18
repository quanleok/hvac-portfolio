-- Create table for AI generation history
CREATE TABLE IF NOT EXISTS ai_generations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('image', 'video', 'music')),
  model TEXT NOT NULL,
  prompt TEXT NOT NULL,
  parameters jsonb DEFAULT '{}',

  -- Generation results
  result_url TEXT NOT NULL,
  result_data jsonb DEFAULT '{}',
  duration_seconds INTEGER,

  -- Metadata
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  task_id TEXT NOT NULL,

  -- Media library integration
  media_library_id uuid REFERENCES public.media(id) ON DELETE SET NULL,

  -- Usage tracking
  used_in_post_id uuid REFERENCES public.marketing_posts(id) ON DELETE SET NULL,

  -- Organization
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by TEXT DEFAULT 'admin' NOT NULL,

  -- Versioning
  version INTEGER DEFAULT 1,

  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_ai_generations_type ON ai_generations(type);
CREATE INDEX IF NOT EXISTS idx_ai_generations_status ON ai_generations(status);
CREATE INDEX IF NOT EXISTS idx_ai_generations_created_at ON ai_generations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_generations_model ON ai_generations(model);
CREATE INDEX IF NOT EXISTS idx_ai_generations_media_library_id ON ai_generations(media_library_id);
CREATE INDEX IF NOT EXISTS idx_ai_generations_used_in_post_id ON ai_generations(used_in_post_id);

-- Add description
COMMENT ON TABLE ai_generations IS 'Tracks all AI content generations (images, videos, music) from Evolink API';
COMMENT ON COLUMN ai_generations.type IS 'Type of content: image, video, or music';
COMMENT ON COLUMN ai_generations.model IS 'Evolink model used (e.g., nano-banana-2-beta, seedance-2.0, suno-v5)';
COMMENT ON COLUMN ai_generations.prompt IS 'Text prompt used for generation';
COMMENT ON COLUMN ai_generations.parameters IS 'Generation parameters (size, duration, aspect ratio, etc.)';
COMMENT ON COLUMN ai_generations.result_url IS 'URL of generated content';
COMMENT ON COLUMN ai_generations.result_data IS 'Raw response data from API';
COMMENT ON COLUMN ai_generations.media_library_id IS 'Link to media library entry if saved';
COMMENT ON COLUMN ai_generations.used_in_post_id IS 'Link to marketing post if used';
COMMENT ON COLUMN ai_generations.task_id IS 'Internal task ID from generation process';
COMMENT ON COLUMN ai_generations.duration_seconds IS 'Duration for video/music';
COMMENT ON COLUMN ai_generations.version IS 'Generation version for tracking updates';

-- Enable Row Level Security
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;

-- Create policy: Admins can read all generations
CREATE POLICY "admins_view_generations" ON ai_generations
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Create policy: Admins can insert generations
CREATE POLICY "admins_create_generations" ON ai_generations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Create policy: Admins can update generations
CREATE POLICY "admins_update_generations" ON ai_generations
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Create policy: Admins can delete generations
CREATE POLICY "admins_delete_generations" ON ai_generations
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Function to audit AI generation usage
CREATE OR REPLACE FUNCTION log_ai_generation_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Log detailed analytics (could be sent to external service)
  INSERT INTO analytics_events (event_type, event_data, created_at)
  VALUES (
    'ai_generation',
    jsonb_build_object(
      'generation_id', NEW.id,
      'type', NEW.type,
      'model', NEW.model,
      'duration', NEW.duration_seconds,
      'status', NEW.status,
      'created_at', NEW.created_at
    ),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for audit logging (optional - requires analytics_events table)
-- CREATE TRIGGER log_ai_generation_trigger
--   AFTER INSERT ON ai_generations
--   FOR EACH ROW
--   EXECUTE FUNCTION log_ai_generation_usage();