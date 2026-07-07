/// <reference types="svelte-clerk/env" />

declare global {
	namespace App {
		interface Error {
			message: string;
		}
		interface Locals {}
		interface PageData {}
		interface Platform {}
	}
}

export {};
