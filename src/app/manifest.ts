import type { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Marcador de Licoes de Casa',
    short_name: 'Marcador',
    description: 'Aplicacao para acompanhamento de licoes',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [
      {
        src: '/iconPWA.jpg',
        type: 'image/jpeg',
      },
    ],
  }
}
