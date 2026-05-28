import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const supabase = await createClient()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const fileType = formData.get('file_type') as string || 'other'

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()
    const fileName = `${projectId}/${crypto.randomUUID()}_${file.name}`
    const fileBuffer = await file.arrayBuffer()

    // 1. Upload to storage bucket
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('project-files')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // 2. Insert metadata record in project_files table
    const { data: fileData, error: dbError } = await supabaseAdmin
      .from('project_files')
      .insert({
        project_id: projectId,
        uploaded_by: user.id,
        file_name: file.name,
        file_type: fileType,
        storage_path: fileName,
        file_size_bytes: file.size,
        mime_type: file.type,
      })
      .select()
      .single()

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ file: fileData })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
