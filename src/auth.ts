import axios from "axios";
const SERVER_URL = 'http://localhost:5000';
// const SERVER_URL = 'https://terminter-admin-nas.herokuapp.com';
export const isAuthenticated = async () =>{
    let parsedToken: any = localStorage.getItem("user")?.toString() ;
    console.log(parsedToken);
    if(JSON.parse(parsedToken).token) {
        const token = JSON.parse(parsedToken)?.token
        let result = await axios.post(`${SERVER_URL}/user/authenticated`, { token })
        .then(res=>{
            if(res.status == 201) {
                return true
            }    
            else {
                return false
            }  
        });
        return result
    }
    
 };
 export const login = async (id: any, password: any)=> {
    axios.post(`${SERVER_URL}/user/login`, {
        user_id: id,
        password
      }).then((res) => {
        console.log(res)
        if(res.data.status) {
        }
      })
 }
