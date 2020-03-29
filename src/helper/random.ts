import {firstNames, lastNames} from './nameData'
import {streetNames} from './streetData'
import {cityNames} from './cityData'
import {stateNames} from './statesData'
import {words} from './wordData'
import { looseObject } from './interfaces'

const randomatic = require('randomatic')

let random: looseObject = {
    find: function find(names: string[]) {
        return names[~~(Math.random() * names.length)].split(' ').map(this.capitalize).join(' ')
    },
    capitalize: function capitalize(name: string) {
        if (name.length < 2) return name.toUpperCase()
        return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
    },
    string: function string(pattern = '*', length = 8) {
        return randomatic(pattern, length)
    },
    get word() {
        return words[~~(Math.random() * words.length)]
    },
    get sentence() {
        let sentence = this.capitalize(this.word)
        let count = ~~(Math.random() * 5) + 3
        for (let i = 0; i < count; i++) {
            sentence += ' ' + this.word
        }
        return sentence + '. '
    },
    get paragraph() {
        let para = this.sentence
        let count = ~~(Math.random() * 5) + 3
        for (let i = 0; i < count; i++) {
            para += this.sentence
        }
        return para + '\n'
    },
    get firstName() {
        return this.find(firstNames)
    },
    get lastName() {
        return this.find(lastNames)
    }, 
    get street() {
        return this.find(streetNames)
    },
    get city() {
        return this.find(cityNames)
    },
    get state() {
        return this.find(stateNames).toUpperCase()
    },
    get person() {
        let p: looseObject = {}
        p.firstName = this.firstName
        p.lastName = this.lastName
        p.email = `${p.firstName.toLowerCase()}.${p.lastName.toLowerCase()}@${randomatic('a', 8)}.com`
        p.street = randomatic('0', 4) + ' ' + this.street
        p.city = this.city
        p.state = this.state
        p.zip = randomatic('0', 5)
        return p;
    }
}

export{random}
