import {firstNames, lastNames} from './nameData'
import {streetNames} from './streetData'
import {cityNames} from './cityData'
import {stateNames} from './statesData'
import {loremIpsum, polishWords, spanishWords, englishWords} from './wordData'
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
    getString: function getString(pattern: string = 'a', length: number = ~~(Math.random()*9)+3) {
        return randomatic(pattern, length)
    },
    get useRealWords() {
        if (this._useRealWords) return this._useRealWords
        else return false
    },
    set useRealWords(value) {
        this._useRealWords = value
    },
    get language() {
        if (this._language) return this._language
        else return null
    },
    set language(value) {
        this._language = value
    },
    get string() {
        //let count = ~~(Math.random() * 15) + 1
        return this.getString()
    },
    get word() {
        if (this.language == 'spanish') {
            return spanishWords[~~(Math.random() * spanishWords.length)]
        } else if (this.language == 'polish') {
            return polishWords[~~(Math.random() * polishWords.length)]
        } else if (this.language == 'english') {
            return englishWords[~~(Math.random() * englishWords.length)]
        } else {
            return loremIpsum[~~(Math.random() * loremIpsum.length)]
        }
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
        return para
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
