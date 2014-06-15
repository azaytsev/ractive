import isEqual from 'utils/isEqual';
import createBranch from 'utils/createBranch';
import notifyDependants from 'shared/notifyDependants';

export default function Viewmodel$set ( keypath, value, silent ) {
	var keys, lastKey, parentKeypath, parentValue, computation, wrapper, evaluator, dontTeardownWrapper;

	if ( isEqual( this.cache[ keypath ], value ) ) {
		return;
	}

	computation = this.computations[ keypath ];
	wrapper = this.wrapped[ keypath ];
	evaluator = this.evaluators[ keypath ];

	if ( computation && !computation.setting ) {
		computation.set( value );
	}

	// If we have a wrapper with a `reset()` method, we try and use it. If the
	// `reset()` method returns false, the wrapper should be torn down, and
	// (most likely) a new one should be created later
	if ( wrapper && wrapper.reset ) {
		dontTeardownWrapper = ( wrapper.reset( value ) !== false );

		if ( dontTeardownWrapper ) {
			value = wrapper.get();
		}
	}

	// Update evaluator value. This may be from the evaluator itself, or
	// it may be from the wrapper that wraps an evaluator's result - it
	// doesn't matter
	if ( evaluator ) {
		evaluator.value = value;
	}

	if ( !computation && !evaluator && !dontTeardownWrapper ) {
		keys = keypath.split( '.' );
		lastKey = keys.pop();

		parentKeypath = keys.join( '.' );

		wrapper = this.wrapped[ parentKeypath ];

		if ( wrapper && wrapper.set ) {
			wrapper.set( lastKey, value );
		} else {
			parentValue = wrapper ? wrapper.get() : this.get( parentKeypath );

			if ( !parentValue ) {
				parentValue = createBranch( lastKey );
				this.set( parentKeypath, parentValue, true );
			}

			parentValue[ lastKey ] = value;
		}
	}

	this.clearCache( keypath, dontTeardownWrapper );

	if ( !silent ) {
		this.changes.push( keypath );
		notifyDependants( this.ractive, keypath );
	}
}