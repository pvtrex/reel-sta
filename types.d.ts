<<<<<<< HEAD
/* eslint-disable no-var */
import { Connection } from "mongoose";

declare global {
  var mongoose: {
    conn: Connection | null;
    promise: Promise<Connection> | null;
  };
}

export {};
=======
import mongoose, { Connection } from "mongoose";

declare global {
    var mongoose: {
        conn: Connection | null;
        promise: Promise<Connection> | null;
    };
}
>>>>>>> 29918cf65ad23af40f215411a3bd84847398af4a
