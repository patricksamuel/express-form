class UsersStorage{
    constructor(){
        this.storage={};
        this.id = 0;
    }
    addUser({firstName,lastName, email, age}){
        const id = this.id;
        this.storage[id] = {id,firstName,lastName, email, age}
        this.id++;
        console.log("AFTER ADD:", this.storage)
    }
    getUsers(){
        console.log("GET USERS:", this.storage);
        return Object.values(this.storage)
    }
    getUser(id) {
        return this.storage[id]
    }
    updateUser(id, {firstName,lastName, email, age}) {
        this.storage[id] = {id,firstName,lastName, email, age}
    }
    deleteUser(id){
        delete this.storage[id];
    }
    getUsersSearch(firstNameQuery,emailQuery){
        const users = this.getUsers()
        const results = users.filter(user => {
            const matchFirst = firstNameQuery
                ? user.firstName.toLowerCase().includes(firstNameQuery.toLowerCase())
                : false;
            const matchEmail = emailQuery
                ? user.email.toLowerCase().includes(emailQuery.toLowerCase())
                : false;
            return matchEmail || matchFirst;
            
        })
        return results;
    }

}

module.exports= new UsersStorage()
