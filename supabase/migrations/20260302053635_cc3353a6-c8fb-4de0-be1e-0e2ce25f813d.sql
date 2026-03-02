
-- Re-create the trigger for debit credits on hiring request
CREATE OR REPLACE TRIGGER debit_credits_on_hiring_request
  BEFORE INSERT ON public.hiring_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.debit_credits_on_hiring_request();

-- Re-create the trigger for refund credits on cancel
CREATE OR REPLACE TRIGGER refund_credits_on_cancel
  BEFORE UPDATE ON public.hiring_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.refund_credits_on_cancel();

-- Re-create the trigger for auto shortage alert
CREATE OR REPLACE TRIGGER auto_create_shortage_alert
  AFTER INSERT ON public.hiring_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_shortage_alert();
