import { DateTime } from 'luxon'

export default interface TimeMode {
    autoLoading: boolean;
    getTime: () => DateTime;
}

// Live == {true, () => now()}
// TimeTravel == {false, () => XX}
