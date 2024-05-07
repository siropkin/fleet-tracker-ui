import {Entity} from "@data-client/rest";
import {JulianDate} from "cesium";

export class RaceDate extends Entity {
    date: number | null = null;

    constructor(date: number | null) {
        super();
        this.date = date;
    }

    pk(): string {
        return `${this.date}`;
    }

    toMilliseconds(): number {
        if (!this.date) {
            return 0;
        }
        return this.date * 1000;
    }

    toJulianDate(): JulianDate | undefined {
        if (!this.date) {
            return undefined;
        }
        return JulianDate.fromDate(new Date(this.toMilliseconds()));
    }
}
