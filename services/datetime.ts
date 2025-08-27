
export const formatDateForApi = (dateString: string): string => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        // Handle invalid date string by returning current time formatted
        console.warn(`Invalid date string provided to formatDateForApi: ${dateString}. Falling back to current time.`);
        const now = new Date();
        return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    }
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

export const formatDateTimeForInput = (dateString: string): string => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
         // The slice(0, 16) formats it to 'YYYY-MM-DDTHH:mm', which is what datetime-local input expects.
         // This assumes the dateString is in UTC and converts it to the user's local timezone for the input.
        const timeZoneOffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
        const localISOTime = (new Date(date.getTime() - timeZoneOffset)).toISOString().slice(0, 16);
        return localISOTime;
    } catch(e) {
        console.error("Error formatting date for input:", e);
        return '';
    }
};
