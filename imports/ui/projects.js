import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import {Projects} from '../api/projects.js';
import './projects.html';

Template.projects.onRendered(function onRendered() {
    this.$('[data-toggle="tooltip"]').tooltip();
});

Template.projects.helpers({
    projects() {
        return Projects.find({}, {'_id': 0, 'name': 1, description: '1'});
    },
});
