import axios from "axios";

const BASE_URL = 'https://chulengan0209.pythonanywhere.com/';

export const endpoints = {
    'login': '/o/token/',
    'users': '/users/',
    'current_user': '/users/current_user/',
    'apartments': '/apartments/',
    'residents': '/residents/',
    'invoices': '/invoices/',
    'lockers': '/lockeritem/',
    'lockeritems': '/lockeritems/',
    'complaints': '/complaints/',
    'surveys': '/surveys/',
    'visitors': '/visitors/',
    'parking_cards': '/parkingcards/',
    'payments': '/payments/',
};

export const authApis = (token) => {
    return axios.create({
        baseURL: BASE_URL,
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
}

export default axios.create({
    baseURL: BASE_URL
});