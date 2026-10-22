/**
 * Helper to download the project zip archive reliably across all browsers,
 * mobile devices, and iframe sandboxes using Blob URL.
 */
export async function downloadProjectZip(): Promise<void> {
  try {
    const res = await fetch('/tetris-engine-android.zip');
    if (!res.ok) {
      throw new Error(`Failed to fetch zip: ${res.statusText}`);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'tetris-engine-android.zip';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 5000);
  } catch (err) {
    console.warn('Blob download failed, falling back to window.location:', err);
    window.location.href = '/tetris-engine-android.zip';
  }
}
