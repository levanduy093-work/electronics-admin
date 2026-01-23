import client from '../api/client'

const CLOUDINARY_HOST_RE = /res\.cloudinary\.com/i

export async function uploadImageFile(file: File, folder: string) {
  const formData = new FormData()
  formData.append('file', file)
  const res = await client.post('/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    params: { folder },
  })
  return res.data?.secure_url || res.data?.url
}

export async function uploadImageByUrl(rawUrl: string, folder: string) {
  const url = String(rawUrl || '').trim()
  if (!url) return null
  if (CLOUDINARY_HOST_RE.test(url)) return url
  const res = await client.post(
    '/upload/image/by-url',
    { url },
    {
      params: { folder },
    },
  )
  return res.data?.secure_url || res.data?.url || url
}

export async function uploadImageFiles(files: File[], folder: string) {
  const uploads = files.map(async (file) => uploadImageFile(file, folder))
  const results = await Promise.all(uploads)
  return results.filter((url): url is string => Boolean(url))
}

export async function uploadImageUrls(urls: string[], folder: string) {
  const uploads = urls.map(async (url) => {
    try {
      return await uploadImageByUrl(url, folder)
    } catch {
      return url
    }
  })
  const results = await Promise.all(uploads)
  return results.filter((url): url is string => Boolean(url))
}

export async function uploadDatasheetFile(file: File, folder: string) {
  const formData = new FormData()
  formData.append('file', file)
  const res = await client.post('/upload/file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    params: { folder },
  })
  return res.data?.secure_url || res.data?.url
}

