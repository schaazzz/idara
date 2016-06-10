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
    'click [name=open-issue-page]'(event, template) {
        var project = event.target.id;
        var issue = project.split(':')[1];

        project = project.split(':')[0];
        activeProject.set(project);
        activeIssue.set(issue);
        target.set('issuePage');
    },
    'click [name=open-project-page]'(event, template) {
        activeProject.set(event.target.id);
        target.set('projectPage');
    }
});
