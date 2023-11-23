export function checkChannelName(channelName: string): boolean {
  //TODO: Verificar que no tiene caracteres extraños
  return channelName.startsWith('#');
}
