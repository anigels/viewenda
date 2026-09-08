import { IonInput, IonItem, IonList } from '@ionic/react';
export function ScheduleFields({ date, time, onDate, onTime, disabled }: { date: string; time: string; onDate: (value: string) => void; onTime: (value: string) => void; disabled?: boolean }) {
  return <IonList className="schedule-fields"><IonItem><IonInput label="Watch date" labelPlacement="stacked" type="date" value={date} required disabled={disabled} onIonInput={e => onDate(e.detail.value ?? '')} /></IonItem><IonItem><IonInput label="Time (optional)" labelPlacement="stacked" type="time" value={time} disabled={disabled} onIonInput={e => onTime(e.detail.value ?? '')} /></IonItem></IonList>;
}
