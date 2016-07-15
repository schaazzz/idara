import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Projects } from '../api/projects';
import { Issues } from '../api/issues';
import '../api/helpers';
import './search-results.html';

let projectSelected = new ReactiveVar(false);
let filterSelected = new ReactiveVar(false);
let activeFilter = new ReactiveVar();
let optionsChanged = new ReactiveVar(false);
let searchTxt = new ReactiveVar('');
let searchFilter = {};
let options = [];
let customFields = [];

function updateSearchTxt() {
    let filterTxt = {};

    if (searchFilter.project) {
        filterTxt['project'] = 'Project is ' + searchFilter.project;
    }

    if (searchFilter.priority) {
        if (searchFilter.priority.$ne) {
            filterTxt['priority'] = 'Priority is not ' + searchFilter.priority.$ne;
        } else {
            filterTxt['priority'] = 'Priority is ' + searchFilter.priority;
        }
    }

    console.log(filterTxt);
}

Template.searchResults.onRendered(function onRendered() {
    if (activeProject.get()) {
        $('#select-project').val(activeProject.get());
        projectSelected.set(true);
    } else {
        projectSelected.set(false);
    }
});

Template.searchResults.helpers({
    isProjectSelected() {
        return projectSelected.get();
    },
    isFilterSelected() {
            return filterSelected.get();
    },
    projects() {
        return Projects.find({});
    },
    options() {
        let result = {optionsChanged: optionsChanged.get(), array: options};
        optionsChanged.set(false);

        return (result);
    },
    searchResults() {
        let results;
        if (projectSelected.get()) {
            results = Issues.find({project: activeProject.get(), title: {$regex: searchTerm.get()}});
        } else {
            results = Issues.find({title: {$regex: searchTerm.get()}});
        }

        return (results);
    },
    customFieldsRows() {
        customFields = parseCustomFieldRows(activeProject.get());
        return (customFields);
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
    },
    'click #btn-add-filter'(event, template) {
        searchFilter = {};
        if (projectSelected) {
            searchFilter = {'project': activeProject.get()}
            updateSearchTxt();
        }

        $('#modal-filter').modal();
    },
    'change #select-project'(event, template) {
        let selection = $('#select-project option:selected').text();

        if (selection != '-1') {
            projectSelected.set(true);
            activeProject.set(selection);
            searchFilter = {'project': activeProject.get()};
            updateSearchTxt();
        } else {
            projectSelected.set(false);
            activeProject.set(void 0);
        }
    },
    'change #select-filter'(event, template) {
        let selectionTxt = $('#select-filter option:selected').text();
        let selectionVal = $('#select-filter option:selected').val();
        let users = Meteor.users.find({}).fetch();

        if (selectionVal == '-1') {
            options = [];
            optionsChanged.set(true);
            filterSelected.set(false);
            activeFilter.set(void 0);
        } else {
            optionsChanged.set(true);
            filterSelected.set(true);
            activeFilter.set({value: selectionVal, text: selectionTxt});

            if ((selectionTxt =='Responsible') || (selectionTxt == 'Assignee')) {
                options = [];
                for (var i = 0; i < users.length; i++) {
                    options.push(users[i].username);
                }
            } else if (selectionTxt == 'Tracker') {
                options = ['Defect', 'Change Request', 'Enhancement', 'Question'];
            } else if (selectionTxt == 'Priority') {
                options = ['Very Low', 'Low', 'Mid', 'High', 'Very High' ];
            } else if (selectionTxt == 'Severity') {
                options = ['Cosmetic', 'Minor', 'Moderate', 'Major', 'Critical'];
            } else {
                if (selectionVal.indexOf('custom') != -1) {
                    for (var i = 0; i < customFields.length; i++) {
                        if (customFields[i].title == selectionTxt) {
                            options = customFields[i].options;
                        }
                    }
                }
            }
        }
    },
    'change #select-option'(event, template) {
        let selectedOption = $('#select-option option:selected').text();
        let checkEquality = $('#select-equality option:selected').text() == 'is'? true : false;
        let activeFilterCopy = activeFilter.get();
        let activeFilterKey = '';
        let customFieldFilter = false;

        if (activeFilterCopy.text == 'Responsible') {
            activeFilterKey = 'responsible';
        } else if (activeFilterCopy.text == 'Tracker') {
            activeFilterKey = 'tracker';
        } else if (activeFilterCopy.text == 'Priority') {
            activeFilterKey = 'priority';
        } else if (activeFilterCopy.text == 'Severity') {
            activeFilterKey = 'severity';
        } else {
            if (activeFilterCopy.value.indexOf('custom') != -1) {
                customFieldFilter = true;
                console.log(activeFilterCopy.text);
                console.log(selectedOption);
            }
        }

        if (!customFieldFilter) {
            searchFilter[activeFilterKey] = checkEquality? selectedOption : {$ne: selectedOption};
        } else {
            let valueFilter = checkEquality? {value: selectedOption} : {value: {$ne: selectedOption}};

            if (!searchFilter['$and']) {
                searchFilter['$and'] = [];
            }

            searchFilter['$and'].push({
                'customFields': {
                    $elemMatch: {'title': activeFilterCopy.text, 'value': valueFilter.value}
                }
            });
        }

        updateSearchTxt();
        console.log(searchFilter);
    }
});
