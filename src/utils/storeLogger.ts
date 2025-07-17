/**
 * Simple store logger for development debugging
 */
export default function createStoreLogger(storeName: string) {
  if (process.env.NODE_ENV !== 'development') {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return (_state: unknown, _prevState: unknown) => {};
  }

  let prevState: Record<string, unknown> = {};

  return (state: unknown) => {
    /* eslint-disable no-console */
    const timestamp = new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    console.group(`[${storeName}] State Update @ ${timestamp}`);
    console.log('Previous State:', prevState);
    console.log('Current State:', state);

    // Log differences
    const changes: Record<string, unknown> = {};
    const stateObj = state as Record<string, unknown>;
    Object.keys(stateObj).forEach((key) => {
      if (prevState[key] !== stateObj[key]) {
        changes[key] = {
          from: prevState[key],
          to: stateObj[key],
        };
      }
    });

    if (Object.keys(changes).length > 0) {
      console.log('Changes:', changes);
    }

    console.groupEnd();
    /* eslint-enable no-console */
    prevState = { ...stateObj };
  };
}
