-- Remove MIME type restriction on project-files bucket.
-- Client-side extension validation is sufficient; a private bucket
-- does not need server-side MIME enforcement.
update storage.buckets
set allowed_mime_types = null
where id = 'project-files';
