import dayjs from 'dayjs'
export const formatTime=(time?: string | Date)=> {
  if (!time) return '-';
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}
