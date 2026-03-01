// Turnstile configuration
export const TURNSTILE_SITE_KEY = "0x4AAAAAABu6CgmuG63-w5SP" // Replace with your site key

export const requestTurnstileToken = async (
  showModal: (callback: (token: string) => void) => void,
): Promise<string> => {
  return new Promise((resolve) => {
    showModal((token: string) => {
      resolve(token)
    })
  })
}
