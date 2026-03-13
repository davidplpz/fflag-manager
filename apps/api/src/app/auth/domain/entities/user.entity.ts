export class User {
    constructor(
        public readonly id: string,
        public readonly email: string,
        public readonly passwordHash: string,
        public readonly roles: string[],
        public readonly createdAt: Date,
        public readonly updatedAt: Date
    ) { }
}
