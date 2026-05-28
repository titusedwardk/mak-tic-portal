import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const { id: projectId, fileId } = await params
    const supabase = await createClient()

    // 1. Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const supabaseAdmin = createAdminClient()

    // 2. Fetch user role to check if admin/reviewer
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isStaff = ['admin', 'reviewer'].includes(profile?.role || '')

    // 3. Verify user is a member of the project (if not staff)
    if (!isStaff) {
      const { data: membership } = await supabaseAdmin
        .from('project_members')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .maybeSingle()

      const { data: project } = await supabaseAdmin
        .from('projects')
        .select('owner_id')
        .eq('id', projectId)
        .single()

      const isOwner = project?.owner_id === user.id

      if (!membership && !isOwner) {
        return new Response('Access Denied', { status: 403 })
      }
    }

    // 4. Fetch the file metadata to get the storage path
    const { data: fileRecord, error: fileError } = await supabaseAdmin
      .from('project_files')
      .select('*')
      .eq('id', fileId)
      .single()

    if (fileError || !fileRecord) {
      return new Response('File Not Found', { status: 404 })
    }

    // 5. Generate signed URL (expires in 1 hour)
    const { data: signedUrlData, error: signError } = await supabaseAdmin.storage
      .from('project-files')
      .createSignedUrl(fileRecord.storage_path, 3600)

    if (signError || !signedUrlData?.signedUrl) {
      return new Response('Failed to generate secure URL', { status: 550 })
    }

    // 6. Redirect to the signed download URL
    return NextResponse.redirect(signedUrlData.signedUrl, 302)
  } catch (error: any) {
    return new Response(error.message, { status: 500 })
  }
}
