import '@server/listeners/controllers.listener';
import '@server/listeners/core.listener';
import '@server/listeners/model.listener';

declare const PROJECT_ENTRY: string;

try {
  if (PROJECT_ENTRY) {
    require(PROJECT_ENTRY);
  }
} catch (e) {
  //
}
