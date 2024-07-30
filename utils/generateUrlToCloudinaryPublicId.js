import url from 'url'
export function getPublicIdFromImageUrl(imageUrl: string) {
  const parsedUrl = url.parse(imageUrl)
  if (!parsedUrl?.pathname) {
    console.log('Invalid url')
    return
  }
  const pathComponents = parsedUrl.pathname.split('/')

  // The public ID is usually the last component before the file extension
  const imagePath = pathComponents[pathComponents.length - 1]
  const path = imagePath.split('.')
  const publicId = `${pathComponents[pathComponents.length - 2]}/${path[0]}` //flower-inventory/iuvudoblaq3trrs4qm6v

  return publicId
}

// make publicId in this formate
// const publicId = 'flower-inventory/iuvudoblaq3trrs4qm6v';