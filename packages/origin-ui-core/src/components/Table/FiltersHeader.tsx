import React, { useState, useEffect } from 'react';
import { IndividualFilter } from './IndividualFilter';
import clsx from 'clsx';
import { deepEqual } from '../../utils/helper';
import { FilterList } from '@material-ui/icons';
import { useTheme } from '@material-ui/core';

export enum CustomFilterInputType {
    deviceType = 'deviceType',
    string = 'string',
    multiselect = 'multiselect',
    dropdown = 'dropdown',
    slider = 'slider',
    yearMonth = 'yearMonth'
}

export enum FilterRules {
    EQUAL = 'FILTER_RULES::EQUAL',
    FROM = 'FILTER_RULES::FROM',
    TO = 'FILTER_RULES::TO'
}

interface ICustomFilterAvailableOption {
    label: string;
    value: any;
}

interface ICustomFilterInput {
    type: CustomFilterInputType;
    availableOptions?: ICustomFilterAvailableOption[];
    defaultOptions?: string[];
    min?: number;
    max?: number;
    filterRule?: FilterRules;
}

export type RecordPropertyGetterFunction = (record: any) => string | number;

export interface ICustomFilterDefinition {
    property: RecordPropertyGetterFunction;
    label: string;
    input: ICustomFilterInput;
    search?: boolean;
}

export interface ICustomFilter extends ICustomFilterDefinition {
    selectedValue: any;
}

interface IProps {
    filters: ICustomFilterDefinition[];
    filtersChanged: (filters: ICustomFilter[]) => void;
}

export function FiltersHeader(props: IProps) {
    const [menuShown, setMenuShown] = useState(false);
    const [processedFilters, setProcessedFilters] = useState<ICustomFilter[]>([]);
    const { spacing } = useTheme();

    function changeFilterValue(targetFilter: ICustomFilter, selectedValue: any) {
        const index = processedFilters.indexOf(targetFilter);

        const updatedFilter: ICustomFilter = {
            ...targetFilter,
            selectedValue
        };

        const updatedFilters = [
            ...processedFilters.slice(0, index),
            updatedFilter,
            ...processedFilters.slice(index + 1)
        ];

        props.filtersChanged(updatedFilters);

        setProcessedFilters(updatedFilters);
    }

    function setupProcessedFilters() {
        if (
            !props.filters ||
            deepEqual(
                props.filters,
                processedFilters.map(({ label, input, search, property: propertyNew }) => ({
                    label,
                    input,
                    search,
                    propertyNew
                }))
            )
        ) {
            return;
        }

        const newProcessedFilters: ICustomFilter[] = props.filters.map((filter) => {
            if (filter.input.type === CustomFilterInputType.multiselect) {
                return {
                    ...filter,
                    selectedValue: filter.input.defaultOptions
                };
            }

            return {
                ...filter,
                selectedValue: null
            };
        });

        setProcessedFilters(newProcessedFilters);
    }

    useEffect(() => {
        setupProcessedFilters();
    }, [props.filters]);

    if (processedFilters.length === 0) {
        return null;
    }

    const searchFilter = processedFilters.find((f) => f.search);
    const standardFilters = processedFilters.filter((f) => !f.search);

    return (
        <>
            {searchFilter && (
                <div className="pb-4">
                    <IndividualFilter filter={searchFilter} changeFilterValue={changeFilterValue} />
                </div>
            )}

            {standardFilters.length > 0 && (
                <div>
                    <div
                        className={`Filter ${menuShown ? 'Filter-opened' : ''}`}
                        onClick={() => setMenuShown(!menuShown)}
                    >
                        <div className="Filter_icon">
                            <FilterList />
                        </div>
                        Filter
                    </div>
                    {menuShown && (
                        <div
                            className="Filter_menu"
                            style={{ marginBottom: spacing(2), paddingBottom: spacing(1) }}
                        >
                            {standardFilters.map((filter, index) => {
                                return (
                                    <div className={clsx('Filter_menu_item')} key={index}>
                                        <IndividualFilter
                                            filter={filter}
                                            changeFilterValue={changeFilterValue}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
