/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * Generated by convex@1.13.2.
 * To regenerate, run `npx convex dev`.
 * @module
 */

// Import types from Convex server
import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

// Import all your Convex functions from their respective modules
import type * as car from "../car.js";
import type * as clerk from "../clerk.js";
import type * as http from "../http.js";
import type * as users from "../users.js";
import type * as util from "../util.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
// Define the full API type, including all imported modules
declare const fullApi: ApiFromModules<{
  car: typeof car;
  clerk: typeof clerk;
  http: typeof http;
  users: typeof users;
  util: typeof util;
}>;

// Export the public API, which includes only functions marked as "public"
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

// Export the internal API, which includes only functions marked as "internal"
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

// Note: You would typically use the `api` export in your client-side code
// to call Convex functions, while the `internal` export is used for
// server-side operations or background tasks.
