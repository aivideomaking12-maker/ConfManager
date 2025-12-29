
export const sanitizeFilename = (name: string): string => {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9]/gi, '_') // Replace non-alphanumeric with underscore
    .substring(0, 50);
};

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
};

export const addMinutes = (date: Date, minutes: number): Date => {
  return new Date(date.getTime() + minutes * 60000);
};

export const parseTime = (timeStr: string): Date => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};
