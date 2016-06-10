import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Projects } from '../api/projects';
import { Issues } from '../api/issues';
import './search-results.html';

Template.searchResults.helpers({
    searchResults() {
        return Issues.find({title: {$regex: searchTerm.get()}});
    }
});

Template.searchResults.events({
});
