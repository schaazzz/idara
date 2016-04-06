import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import './home.html';

Template.home.helpers({
    taskCount: 0,
});
